import express, { Response } from "express";
import * as Joi from "joi";
import { createValidator } from "express-joi-validation";
import { Request } from "../../../types";
import { Comment, User } from "@prisma/client";
import { ExtendedPrismaClient } from "../../../prisma";
import { pick } from "lodash";
import { JoiExternalIdOptional, JoiString } from "../../../joi";
import rateLimit from "../../../rate-limit";

const router = express.Router({ mergeParams: true });
const validator = createValidator();

type ExternalComment = {
  id: string;
  content: string;
  creator: {
    id: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
};
const entityToType = (
  prisma: ExtendedPrismaClient,
  comment: Comment & {
    creator: User;
  }
): ExternalComment => ({
  ...pick(comment, "content", "createdAt", "updatedAt"),
  id: prisma.comment.idToExternalId(comment.id),
  creator: {
    ...pick(comment.creator, "username"),
    id: prisma.user.idToExternalId(comment.creator.id),
  },
});

export type PaginatedQueryParams = {
  cursor?: string;
};
const paginatedQuerySchema = Joi.object<PaginatedQueryParams>({
  cursor: JoiExternalIdOptional,
});
router.get(
  "/",
  validator.query(paginatedQuerySchema),
  async (
    req: Request<{ snippetId: string }, {}, {}, PaginatedQueryParams>,
    res: Response<ExternalComment[]>
  ) => {
    const cursor =
      req.query.cursor && req.prisma.comment.externalIdToId(req.query.cursor);
    if (cursor !== null && cursor !== "" && Number.isNaN(cursor)) {
      return res.sendStatus(400);
    }

    const snippetExternalId = req.params.snippetId;
    const comments = await req.prisma.comment.findMany({
      where: {
        snippetId: req.prisma.snippet.externalIdToId(snippetExternalId),
      },
      include: { creator: true },
      orderBy: { id: "asc" },
      take: 10,
      skip: req.query.cursor ? 1 : undefined,
      cursor: cursor ? { id: cursor } : undefined,
    });
    res
      .status(200)
      .json(comments.map((comment) => entityToType(req.prisma, comment)));
  }
);

export type CreateCommentInput = {
  content: string;
};
const createCommentSchema = Joi.object<CreateCommentInput>({
  content: JoiString.max(2000).required(),
});
router.post(
  "/",
  rateLimit(
    "snippet-comments-per-second",
    1000, // 1 second
    1
  ),
  rateLimit(
    "snippet-comments-per-day",
    24 * 60 * 60 * 1000, // 24 hours
    5000
  ),
  validator.body(createCommentSchema),
  async (
    req: Request<{ snippetId: string }, {}, CreateCommentInput>,
    res: Response<ExternalComment>
  ) => {
    const snippetExternalId = req.params.snippetId;
    const input = req.body;
    const comment = await req.prisma.comment.create({
      data: {
        content: input.content,
        creatorId: 1, // FIXME: PULL FROM JWT
        snippetId: req.prisma.snippet.externalIdToId(snippetExternalId),
      },
      include: {
        creator: true,
      },
    });
    res.status(201).send(entityToType(req.prisma, comment));
  }
);

export default router;
