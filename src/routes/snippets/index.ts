import express, { Response } from "express";
import * as Joi from "joi";
import { createValidator } from "express-joi-validation";
import retry from "async-retry";
import { Request } from "../../types";
import {
  App,
  Message,
  Snippet,
  SnippetInteraction,
  User,
} from "@prisma/client";
import { ExtendedPrismaClient } from "../../prisma";
import { keyBy, pick } from "lodash";
import { Client } from "twitter-api-sdk";
import { JoiExternalId, JoiString } from "../../joi";
import comments from "./comments";
import rateLimit from "../../middleware/rate-limit";
import { withUser } from "../../middleware/with-user";
import { ExternalApp, entityToType as appEntityToType } from "../apps";
import { ExternalUser, entityToType as userEntityToType } from "../users";
import interaction, {
  ExternalSnippetInteraction,
  entityToType as interactionEntityToType,
} from "./interaction";

const router = express.Router();
const validator = createValidator();

router.use("/:snippetId/comments", comments);
router.use("/:snippetId/interaction", interaction);

export type ExternalMessage = {
  id: string;
  content: string;
  sentAt: string;
  appSpecificDataJson: string | null;
  authorUsername: string;
  authorIdentifier: string | null;
  authorAvatarUrl: string | null;
};
export type ExternalSnippet = {
  id: string;
  public: boolean;
  title: string | null;
  appSpecificDataJson: string | null;
  creator: ExternalUser | null;
  app: ExternalApp;
  messages: ExternalMessage[];
  createdAt: Date;
};

const entityToType = (
  prisma: ExtendedPrismaClient,
  snippet: Snippet & {
    creator: User | null;
    app: App;
    messages: Message[];
  }
): ExternalSnippet => ({
  ...pick(snippet, "public", "title", "appSpecificDataJson", "createdAt"),
  id: prisma.snippet.idToExternalId(snippet.id),
  creator: snippet.creator && userEntityToType(prisma, snippet.creator),
  app: appEntityToType(prisma, snippet.app),
  messages: snippet.messages.map((message) => ({
    ...pick(
      message,
      "content",
      "appSpecificDataJson",
      "authorUsername",
      "authorIdentifier",
      "authorAvatarUrl"
    ),
    id: prisma.message.idToExternalId(message.id),
    sentAt: message.sentAt.toISOString(),
  })),
});

export type ExternalSnippetPreview = ExternalSnippet & {
  interaction: ExternalSnippetInteraction | null;
  totalComments: number;
};

export const previewEntityToType = (
  prisma: ExtendedPrismaClient,
  snippet: Snippet & {
    creator: User | null;
    app: App;
    messages: Message[];
    interaction: SnippetInteraction | null;
    totalComments: number;
  }
): ExternalSnippetPreview => ({
  ...entityToType(prisma, snippet),
  ...pick(snippet, "totalComments"),
  interaction:
    snippet.interaction && interactionEntityToType(prisma, snippet.interaction),
});

const SNIPPETS_PAGE_SIZE = 20;
router.get(
  "/preview",
  async (
    req: Request<{}, {}, {}, { cursor?: string; creatorId?: string }>,
    res: Response<{
      data: ExternalSnippetPreview[];
      isLastPage: boolean;
    }>,
    next
  ) => {
    try {
      const cursor =
        req.query.cursor && req.prisma.snippet.externalIdToId(req.query.cursor);
      const creatorId =
        req.query.creatorId &&
        req.prisma.user.externalIdToId(req.query.creatorId);
      const snippets = await req.prisma.snippet.findMany({
        where: creatorId ? { creatorId } : undefined,
        orderBy: { id: "desc" },
        take: SNIPPETS_PAGE_SIZE + 1,
        skip: req.query.cursor ? 1 : undefined,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
          },
          creator: true,
          app: true,
          interaction: true,
        },
      });
      const commentCounts = await req.prisma.comment.groupBy({
        by: ["snippetId"],
        where: { snippetId: { in: snippets.map(({ id }) => id) } },
        _count: true,
      });
      const commentCountsForSnippets = keyBy(commentCounts, "snippetId");
      res.status(200).json({
        data: snippets.map((snippet) =>
          previewEntityToType(req.prisma, {
            ...snippet,
            totalComments: commentCountsForSnippets[snippet.id]?._count ?? 0,
          })
        ),
        isLastPage: snippets.length <= SNIPPETS_PAGE_SIZE,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (
    req: Request<{ id: string }>,
    res: Response<ExternalSnippet | null>,
    next
  ) => {
    try {
      const externalId = req.params.id;
      const snippet = await req.prisma.snippet.findUnique({
        where: { id: req.prisma.snippet.externalIdToId(externalId) },
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
          },
          creator: true,
          app: true,
        },
      });
      if (!snippet) {
        return res.sendStatus(404);
      }
      res.status(200).json(snippet && entityToType(req.prisma, snippet));
    } catch (err) {
      next(err);
    }
  }
);

export type CreateSnippetInput = {
  appId: string;
  public: boolean;
  title?: string;
  appSpecificData?: object;
  messages: {
    content: string;
    sentAt: Date;
    appSpecificData?: object;
    authorUsername: string;
    authorIdentifier?: string;
    authorAvatarUrl?: string;
  }[];
};
const createSnippetSchema = Joi.object<CreateSnippetInput>({
  appId: JoiExternalId,
  public: Joi.boolean().required(),
  title: JoiString.max(50),
  appSpecificData: Joi.object(),
  messages: Joi.array()
    .min(1)
    .max(500)
    .required()
    .items(
      Joi.object({
        content: Joi.string().allow("").max(4000).required(),
        sentAt: Joi.date().required(),
        appSpecificData: Joi.object(),
        authorUsername: JoiString.max(50).required(),
        authorIdentifier: JoiString.max(50),
        authorAvatarUrl: JoiString.max(200),
      })
    ),
});
router.post(
  "/",
  rateLimit(
    "snippets-per-second",
    1000, // 1 second
    1
  ),
  rateLimit(
    "snippets-per-day",
    24 * 60 * 60 * 1000, // 24 hours
    1000
  ),
  validator.body(createSnippetSchema),
  withUser(),
  async (
    req: Request<{}, {}, CreateSnippetInput>,
    res: Response<ExternalSnippet>,
    next
  ) => {
    try {
      const input = req.body;
      const snippet = await req.prisma.snippet.create({
        data: {
          appId: req.prisma.app.externalIdToId(input.appId),
          public: input.public,
          title: input.title,
          appSpecificDataJson: input.appSpecificData
            ? JSON.stringify(input.appSpecificData)
            : null,
          creatorId: req.user?.id ?? null,
          messages: {
            create: input.messages.map((message) => ({
              content: message.content,
              sentAt: message.sentAt,
              appSpecificDataJson: message.appSpecificData
                ? JSON.stringify(message.appSpecificData)
                : null,
              authorUsername: message.authorUsername,
              authorIdentifier: message.authorIdentifier,
              authorAvatarUrl: message.authorAvatarUrl,
            })),
          },
          interaction: {
            create: {},
          },
        },
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
          },
          creator: true,
          app: true,
          interaction: true,
        },
      });
      res.status(201).send(entityToType(req.prisma, snippet));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/claim",
  rateLimit(
    "snippets-per-second",
    1000, // 1 second
    1
  ),
  rateLimit(
    "snippets-per-day",
    24 * 60 * 60 * 1000, // 24 hours
    1000
  ),
  withUser(),
  async (
    req: Request<{ id: string }>,
    res: Response<ExternalSnippet>,
    next
  ) => {
    try {
      const externalId = req.params.id;
      await req.prisma.snippet.update({
        where: { id: req.prisma.snippet.externalIdToId(externalId) },
        data: { creatorId: req.user && req.user.id, claimed: true },
      });
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  }
);

const twitterClient = new Client(process.env.TWITTER_BEARER_TOKEN!);
export type CreateTwitterSnippetInput = {
  tweetIds: string[];
};
const createTwitterSnippetSchema = Joi.object<CreateTwitterSnippetInput>({
  tweetIds: Joi.array().min(1).required().items(Joi.string().required()),
});
router.post(
  "/twitter",
  rateLimit(
    "snippets-per-second",
    1000, // 1 second
    1
  ),
  rateLimit(
    "snippets-per-day",
    24 * 60 * 60 * 1000, // 24 hours
    1000
  ),
  validator.body(createTwitterSnippetSchema),
  async (
    req: Request<{}, {}, CreateTwitterSnippetInput>,
    res: Response<ExternalSnippet>,
    next
  ) => {
    try {
      const { tweetIds } = req.body;
      const tweets = await retry(
        () =>
          twitterClient.tweets.findTweetsById({
            ids: tweetIds,
            expansions: ["author_id"],
            "user.fields": ["profile_image_url", "username"],
            "tweet.fields": ["created_at", "text", "attachments"],
          }),
        { retries: 3 }
      );

      if (!tweets.data?.length) {
        return res.sendStatus(400);
      }

      const snippet = await req.prisma.snippet.create({
        data: {
          appId: Number(process.env.TWITTER_APP_ID!),
          public: false,
          title: null,
          appSpecificDataJson: null,
          creatorId: null,
          messages: {
            create:
              tweets.data?.map((tweet) => {
                const author = tweets.includes?.users?.find(
                  ({ id }) => id === tweet.author_id
                );
                return {
                  content: tweet.text,
                  sentAt: tweet.created_at!,
                  appSpecificDataJson: JSON.stringify({
                    attachments:
                      tweets.data?.map(({ attachments }) => attachments) ?? [],
                  }),
                  authorUsername: author?.username ?? "unknown",
                  authorIdentifier: null,
                  authorAvatarUrl: author?.profile_image_url,
                };
              }) ?? [],
          },
          interaction: {
            create: {},
          },
        },
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
          },
          creator: true,
          app: true,
          interaction: true,
        },
      });
      res.status(201).send(entityToType(req.prisma, snippet));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
