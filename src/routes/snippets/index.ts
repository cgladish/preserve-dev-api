import express, { Response } from "express";
import * as Joi from "joi";
import { createValidator } from "express-joi-validation";
import { Request } from "../../types";
import { Message, Snippet } from "@prisma/client";
import { ExtendedPrismaClient } from "../../prisma";
import { pick } from "lodash";
import { JoiExternalId, JoiString } from "../../joi";
import comments from "./comments";
import rateLimit from "../../middleware/rate-limit";
import { withUser } from "../../middleware/require-auth";

const router = express.Router();
const validator = createValidator();

router.use("/:snippetId/comments", comments);

type ExternalMessage = {
  id: string;
  content: string;
  sentAt: string;
  appSpecificDataJson: string | null;
  authorUsername: string;
  authorIdentifier: string | null;
  authorAvatarUrl: string | null;
};
type ExternalSnippet = {
  id: string;
  public: boolean;
  title: string | null;
  appSpecificDataJson: string | null;
  views: number;
  creatorId: string | null;
  appId: string;
  messages: ExternalMessage[];
};
const entityToType = (
  prisma: ExtendedPrismaClient,
  snippet: Snippet & {
    messages: Message[];
  }
): ExternalSnippet => ({
  ...pick(snippet, "public", "title", "appSpecificDataJson", "views"),
  id: prisma.snippet.idToExternalId(snippet.id),
  creatorId: snippet.creatorId
    ? prisma.user.idToExternalId(snippet.creatorId)
    : null,
  appId: prisma.app.idToExternalId(snippet.appId),
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

router.get(
  "/:snippetId",
  async (req: Request, res: Response<ExternalSnippet | null>, next) => {
    try {
      const externalId = req.params.snippetId;
      const snippet = await req.prisma.snippet.findUnique({
        where: { id: req.prisma.snippet.externalIdToId(externalId) },
        include: {
          messages: {
            orderBy: { id: "asc" },
          },
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
        content: JoiString.max(4000).required(),
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
        },
        include: { messages: true },
      });
      res.status(201).send(entityToType(req.prisma, snippet));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
