import express, { Response } from "express";
import * as Joi from "joi";
import { createValidator } from "express-joi-validation";
import { Request } from "../../types";
import { Message, Snippet } from "@prisma/client";
import { ExtendedPrismaClient } from "../../prisma";
import { pick } from "lodash";

const router = express.Router();
const validator = createValidator();

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
  creatorId: string;
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
  creatorId: prisma.user.idToExternalId(snippet.creatorId),
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
  "/:id",
  async (req: Request, res: Response<ExternalSnippet | null>) => {
    const externalId = req.params.id;
    const snippet = await req.prisma.snippet.findUnique({
      where: { id: req.prisma.snippet.externalIdToId(externalId) },
      include: {
        messages: true,
      },
    });
    if (!snippet) {
      return res.sendStatus(404);
    }
    res.status(200).send(snippet && entityToType(req.prisma, snippet));
  }
);

type CreateSnippetInput = {
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
  appId: Joi.string().required(),
  public: Joi.boolean().required(),
  title: Joi.string().empty(""),
  appSpecificData: Joi.object(),
  messages: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        content: Joi.string().required(),
        sentAt: Joi.date().required(),
        appSpecificDataJson: Joi.object(),
        authorUsername: Joi.string().required(),
        authorIdentifier: Joi.string(),
        authorAvatarUrl: Joi.string(),
      })
    ),
});
router.post(
  "/",
  validator.body(createSnippetSchema),
  async (
    req: Request<{}, {}, CreateSnippetInput>,
    res: Response<ExternalSnippet | null>
  ) => {
    const input = req.body;
    const snippet = await req.prisma.snippet.create({
      data: {
        appId: req.prisma.app.externalIdToId(input.appId),
        public: input.public,
        title: input.title,
        appSpecificDataJson: input.appSpecificData
          ? JSON.stringify(input.appSpecificData)
          : null,
        creatorId: 1, // FIXME: PULL FROM JWT
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
  }
);

export default router;
