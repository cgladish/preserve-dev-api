import express, { Response } from "express";
import * as Joi from "joi";
import { createValidator } from "express-joi-validation";
import retry from "async-retry";
import AWS from "aws-sdk";
import { Request } from "../../types";
import {
  App,
  Message,
  MessageAttachment,
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
import wrapRequestHandler from "../../wrapRequestHandler";

const router = express.Router();
const validator = createValidator();

router.use("/:snippetId/comments", comments);
router.use("/:snippetId/interaction", interaction);

export type ExternalAttachment = {
  id: string;
  type: string;
  filename: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
};
export type ExternalMessage = {
  id: string;
  externalId: string | null;
  content: string;
  sentAt: string;
  attachments: ExternalAttachment[] | null;
  authorUsername: string;
  authorIdentifier: string | null;
  authorAvatarUrl: string | null;
};
export type ExternalSnippet = {
  id: string;
  public: boolean;
  nsfw: boolean;
  claimed: boolean;
  title: string | null;
  creatorId: string | null;
  creator: ExternalUser | null;
  app: ExternalApp | null;
  messages: ExternalMessage[] | null;
  interaction: ExternalSnippetInteraction | null;
  createdAt: Date;
};

const entityToType = (
  prisma: ExtendedPrismaClient,
  snippet: Snippet & {
    creator?: User | null;
    app?: App;
    messages?: (Message & {
      attachments?: MessageAttachment[];
    })[];
    interaction?: SnippetInteraction | null;
  }
): ExternalSnippet => ({
  ...pick(snippet, "public", "claimed", "nsfw", "title", "createdAt"),
  id: prisma.snippet.idToExternalId(snippet.id),
  creatorId: snippet.creatorId
    ? prisma.user.idToExternalId(snippet.creatorId)
    : null,
  creator: snippet.creator ? userEntityToType(prisma, snippet.creator) : null,
  app: snippet.app ? appEntityToType(prisma, snippet.app) : null,
  messages:
    snippet.messages?.map((message) => ({
      ...pick(
        message,
        "externalId",
        "content",
        "authorUsername",
        "authorIdentifier",
        "authorAvatarUrl"
      ),
      id: prisma.message.idToExternalId(message.id),
      sentAt: message.sentAt.toISOString(),
      attachments:
        message.attachments?.map((attachment) => ({
          ...pick(
            attachment,
            "type",
            "filename",
            "url",
            "width",
            "height",
            "size"
          ),
          id: prisma.messageAttachment.idToExternalId(attachment.id),
        })) ?? null,
    })) ?? null,
  interaction: snippet.interaction
    ? interactionEntityToType(prisma, snippet.interaction)
    : null,
});

export type ExternalSnippetPreview = ExternalSnippet & {
  totalComments: number;
};

export const previewEntityToType = (
  prisma: ExtendedPrismaClient,
  snippet: Snippet & {
    creator: User | null;
    app: App;
    messages: (Message & {
      attachments: MessageAttachment[];
    })[];
    totalComments: number;
    interaction: SnippetInteraction | null;
  }
): ExternalSnippetPreview => ({
  ...entityToType(prisma, snippet),
  ...pick(snippet, "totalComments"),
});

const SNIPPETS_PAGE_SIZE = 20;
router.get(
  "/preview",
  withUser(),
  wrapRequestHandler(
    async (
      req: Request<{}, {}, {}, { cursor?: string; creatorId?: string }>,
      res: Response<{
        data: ExternalSnippetPreview[];
        isLastPage: boolean;
      }>,
      next
    ) => {
      const cursor =
        req.query.cursor && req.prisma.snippet.externalIdToId(req.query.cursor);
      const creatorId =
        req.query.creatorId &&
        req.prisma.user.externalIdToId(req.query.creatorId);
      const showPrivate = !!creatorId && creatorId === req.user?.id;
      const snippets = await req.prisma.snippet.findMany({
        where: {
          ...(creatorId ? { creatorId } : { nsfw: false, adminApproved: true }),
          ...(showPrivate ? {} : { public: true }),
        },
        orderBy: { id: "desc" },
        take: SNIPPETS_PAGE_SIZE + 1,
        skip: req.query.cursor ? 1 : undefined,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          messages: {
            orderBy: { sentAt: "asc" },
            include: {
              attachments: true,
            },
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
    }
  )
);

router.get(
  "/unreviewed",
  withUser({ permissions: ["read:unreviewed"] }),
  wrapRequestHandler(
    async (
      req: Request<{}, {}, {}, { cursor?: string }>,
      res: Response<{
        data: ExternalSnippet[];
        isLastPage: boolean;
      }>,
      next
    ) => {
      const cursor =
        req.query.cursor && req.prisma.snippet.externalIdToId(req.query.cursor);
      const snippets = await req.prisma.snippet.findMany({
        where: { public: true, adminReviewed: false, nsfw: false },
        orderBy: { id: "desc" },
        take: SNIPPETS_PAGE_SIZE + 1,
        skip: req.query.cursor ? 1 : undefined,
        cursor: cursor ? { id: cursor } : undefined,
      });
      res.status(200).json({
        data: snippets.map((snippet) => entityToType(req.prisma, snippet)),
        isLastPage: snippets.length <= SNIPPETS_PAGE_SIZE,
      });
    }
  )
);

router.get(
  "/:id",
  wrapRequestHandler(
    async (
      req: Request<{ id: string }, {}, { full?: string }>,
      res: Response<ExternalSnippet | null>,
      next
    ) => {
      const externalId = req.params.id;
      const full = req.query.full === "true";
      const snippet = await req.prisma.snippet.findUnique({
        where: { id: req.prisma.snippet.externalIdToId(externalId) },
        include: full
          ? {
              messages: {
                orderBy: { sentAt: "asc" },
                include: {
                  attachments: true,
                },
              },
              creator: true,
              app: true,
              interaction: true,
            }
          : undefined,
      });
      if (!snippet) {
        return res.sendStatus(404);
      }
      res.status(200).json(snippet && entityToType(req.prisma, snippet));
    }
  )
);

export type CreateSnippetInput = {
  appId: string;
  messages: {
    content: string;
    sentAt: Date;
    attachments?: {
      type: string;
      url?: string;
      width?: number;
      height?: number;
      size?: number;
    }[];
    authorUsername: string;
    authorIdentifier?: string;
    authorAvatarUrl?: string;
  }[];
};
const createSnippetSchema = Joi.object<CreateSnippetInput>({
  appId: JoiExternalId,
  messages: Joi.array()
    .min(1)
    .max(500)
    .required()
    .items(
      Joi.object({
        content: Joi.string().allow("").max(4000).required(),
        sentAt: Joi.date().required(),
        attachments: Joi.array().items(
          Joi.object({
            type: Joi.string().required(),
            url: Joi.string(),
            width: Joi.number().integer(),
            height: Joi.number().integer(),
            size: Joi.number().integer(),
          })
        ),
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
  wrapRequestHandler(
    async (
      req: Request<{}, {}, CreateSnippetInput>,
      res: Response<ExternalSnippet>,
      next
    ) => {
      const input = req.body;
      const snippet = await req.prisma.snippet.create({
        data: {
          appId: req.prisma.app.externalIdToId(input.appId),
          creatorId: req.user?.id ?? null,
          messages: {
            create: input.messages.map((message) => ({
              content: message.content,
              sentAt: message.sentAt,
              attachments: {
                create: message.attachments,
              },
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
            include: {
              attachments: true,
            },
          },
          creator: true,
          app: true,
          interaction: true,
        },
      });
      res.status(201).send(entityToType(req.prisma, snippet));
    }
  )
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
  wrapRequestHandler(
    async (
      req: Request<{}, {}, CreateTwitterSnippetInput>,
      res: Response<ExternalSnippet>,
      next
    ) => {
      const { tweetIds } = req.body;
      const tweets = await retry(
        () =>
          twitterClient.tweets.findTweetsById({
            ids: tweetIds,
            expansions: ["author_id", "attachments.media_keys"],
            "user.fields": ["profile_image_url", "username"],
            "tweet.fields": ["created_at", "text", "attachments"],
            "media.fields": ["url", "type", "width", "height"],
          }),
        { retries: 1 }
      );

      if (!tweets.data?.length) {
        return res.sendStatus(400);
      }

      const snippet = await req.prisma.snippet.create({
        data: {
          appId: Number(process.env.TWITTER_APP_ID!),
          public: false,
          title: null,
          creatorId: null,
          messages: {
            create:
              tweets.data?.map((tweet) => {
                const author = tweets.includes?.users?.find(
                  ({ id }) => id === tweet.author_id
                );
                return {
                  externalId: tweet.id,
                  content: tweet.text,
                  sentAt: tweet.created_at!,
                  attachments: {
                    create:
                      tweet.attachments?.media_keys
                        ?.map((mediaKey) => {
                          const media = tweets.includes?.media?.find(
                            ({ media_key }) => media_key === mediaKey
                          );
                          return (media && {
                            type: media.type,
                            url: (media as any).url,
                            width: media.width,
                            height: media.height,
                          })!;
                        })
                        .filter((attachment) => attachment) ?? [],
                  },
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
            include: {
              attachments: true,
            },
          },
          creator: true,
          app: true,
          interaction: true,
        },
      });
      res.status(201).send(entityToType(req.prisma, snippet));
    }
  )
);

export type UpdateSnippetInput = {
  public?: boolean;
  nsfw?: boolean;
  title?: string;
};
const updateSnippetSchema = Joi.object<UpdateSnippetInput>({
  public: Joi.boolean(),
  nsfw: Joi.boolean(),
  title: JoiString.max(50),
});
router.post(
  "/:id",
  validator.body(updateSnippetSchema),
  withUser({ required: true }),
  wrapRequestHandler(
    async (
      req: Request<{ id: string }, {}, UpdateSnippetInput>,
      res: Response<ExternalSnippet>,
      next
    ) => {
      const externalId = req.params.id;
      const input = req.body;
      const id = req.prisma.snippet.externalIdToId(externalId);
      const existingSnippet = await req.prisma.snippet.findUnique({
        where: { id },
      });
      if (!existingSnippet) {
        return res.sendStatus(404);
      }
      if (
        !existingSnippet.creatorId ||
        existingSnippet.creatorId !== req.user?.id
      ) {
        return res.sendStatus(401);
      }
      if (existingSnippet.public) {
        return res.sendStatus(400); // Can't update once public
      }
      const snippet = await req.prisma.snippet.update({
        where: {
          id: req.prisma.snippet.externalIdToId(externalId),
        },
        data: {
          nsfw: input.nsfw,
          public: input.public ? true : undefined, // Can't go back to private once public
          title: input.title,
        },
      });
      res.status(200).send(entityToType(req.prisma, snippet));
    }
  )
);

export type ReviewSnippetInput = {
  approved: boolean;
};
const reviewSnippetSchema = Joi.object<ReviewSnippetInput>({
  approved: Joi.boolean().required(),
});
router.post(
  "/:id/review",
  validator.body(reviewSnippetSchema),
  withUser({ required: true, permissions: ["edit:unreviewed"] }),
  wrapRequestHandler(
    async (
      req: Request<{ id: string }, {}, ReviewSnippetInput>,
      res: Response<ExternalSnippet>,
      next
    ) => {
      const externalId = req.params.id;
      const input = req.body;
      const id = req.prisma.snippet.externalIdToId(externalId);
      const existingSnippet = await req.prisma.snippet.findUnique({
        where: { id },
      });
      if (!existingSnippet) {
        return res.sendStatus(404);
      }
      if (existingSnippet.adminApproved) {
        return res.sendStatus(400); // Can't reapprove a snippet
      }
      const snippet = await req.prisma.snippet.update({
        where: {
          id: req.prisma.snippet.externalIdToId(externalId),
        },
        data: {
          adminReviewed: true,
          adminApproved: input.approved,
        },
      });
      res.status(200).send(entityToType(req.prisma, snippet));
    }
  )
);

router.post(
  "/:id/claim",
  withUser(),
  wrapRequestHandler(
    async (
      req: Request<{ id: string }>,
      res: Response<ExternalSnippet>,
      next
    ) => {
      const externalId = req.params.id;
      const id = req.prisma.snippet.externalIdToId(externalId);
      const existingSnippet = await req.prisma.snippet.findUnique({
        where: { id },
      });
      if (!existingSnippet) {
        return res.sendStatus(404);
      }
      if (existingSnippet.claimed) {
        return res.sendStatus(401);
      }
      await req.prisma.snippet.update({
        where: { id },
        data: { creatorId: req.user && req.user.id, claimed: true },
      });
      res.sendStatus(200);
    }
  )
);

const SES = new AWS.SES({ region: "us-east-1" });
export type CreateDeletionRequestInput = {
  reasonText: string;
};
const createDeletionRequestSchema = Joi.object<CreateDeletionRequestInput>({
  reasonText: Joi.string().max(1000).required(),
});
router.post(
  "/:id/deletionRequest",
  rateLimit(
    "deletion-requests-per-second",
    1000, // 1 second
    1
  ),
  rateLimit(
    "deletion-requests-per-day",
    24 * 60 * 60 * 1000, // 24 hours
    100
  ),
  validator.body(createDeletionRequestSchema),
  withUser(),
  wrapRequestHandler(
    async (
      req: Request<{ id: string }, {}, CreateDeletionRequestInput>,
      res: Response<ExternalSnippet>,
      next
    ) => {
      const externalId = req.params.id;
      await SES.sendEmail({
        Source: "noreply@preserve.dev",
        Destination: { ToAddresses: ["support@preserve.dev"] },
        Message: {
          Subject: {
            Charset: "UTF-8",
            Data: `Deletion request for Snippet ${externalId}`,
          },
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: `
Deletion requested for <a href="https://www.preserve.dev/p/${externalId}">${externalId}</a>
<br /><br />
<b>Username:</b> ${req.user?.username ?? "non-logged in user"}
<br />
<b>IP Address:</b> ${req.ip}
<br />
<b>Reason:</b> <p>${req.body.reasonText}</p>
              `,
            },
          },
        },
      }).promise();

      res.sendStatus(201);
    }
  )
);

export default router;
