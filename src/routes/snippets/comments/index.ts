import express, { Response } from "express";
import * as Joi from "joi";
import { createValidator } from "express-joi-validation";
import { Request } from "../../../types";
import { Comment, User } from "@prisma/client";
import { ExtendedPrismaClient } from "../../../prisma";
import { pick } from "lodash";
import { JoiExternalIdOptional, JoiString } from "../../../joi";
import { entityToType as userEntityToType } from "../../users";
import rateLimit from "../../../middleware/rate-limit";
import { withUser } from "../../../middleware/with-user";
import wrapRequestHandler from "../../../wrapRequestHandler";

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
  creator: userEntityToType(prisma, comment.creator),
});

const COMMENTS_PAGE_SIZE = 20;
export type PaginatedQueryParams = {
  cursor?: string;
};
const paginatedQuerySchema = Joi.object<PaginatedQueryParams>({
  cursor: JoiExternalIdOptional,
});
router.get(
  "/",
  validator.query(paginatedQuerySchema),
  wrapRequestHandler(
    async (
      req: Request<{ snippetId: string }, {}, {}, PaginatedQueryParams>,
      res: Response<{
        data: ExternalComment[];
        totalCount: number;
        isLastPage: boolean;
      }>,
      next
    ) => {
      const cursor =
        req.query.cursor && req.prisma.comment.externalIdToId(req.query.cursor);
      const snippetExternalId = req.params.snippetId;
      const snippetId = req.prisma.snippet.externalIdToId(snippetExternalId);

      const totalCount = await req.prisma.comment.count({
        where: { snippetId },
      });
      const comments = await req.prisma.comment.findMany({
        where: { snippetId },
        include: { creator: true },
        orderBy: { id: "asc" },
        take: COMMENTS_PAGE_SIZE + 1,
        skip: req.query.cursor ? 1 : undefined,
        cursor: cursor ? { id: cursor } : undefined,
      });
      res.status(200).json({
        data: comments
          .slice(0, COMMENTS_PAGE_SIZE)
          .map((comment) => entityToType(req.prisma, comment)),
        totalCount,
        isLastPage: comments.length <= COMMENTS_PAGE_SIZE,
      });
    }
  )
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
  withUser({ required: true }),
  wrapRequestHandler(
    async (
      req: Request<{ snippetId: string }, {}, CreateCommentInput>,
      res: Response<ExternalComment>,
      next
    ) => {
      const snippetExternalId = req.params.snippetId;
      const input = req.body;
      const comment = await req.prisma.comment.create({
        data: {
          content: input.content,
          creatorId: req.user!.id,
          snippetId: req.prisma.snippet.externalIdToId(snippetExternalId),
        },
        include: {
          creator: true,
        },
      });
      res.status(201).send(entityToType(req.prisma, comment));
    }
  )
);

export default router;
