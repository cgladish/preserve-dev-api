import express, { Response } from "express";
import { Request } from "../../../types";
import { SnippetInteraction } from "@prisma/client";
import { ExtendedPrismaClient } from "../../../prisma";
import { pick } from "lodash";

const router = express.Router({ mergeParams: true });

export type ExternalSnippetInteraction = {
  id: string;
  snippetId: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
};
const entityToType = (
  prisma: ExtendedPrismaClient,
  interaction: SnippetInteraction
): ExternalSnippetInteraction => ({
  ...pick(interaction, "views", "createdAt", "updatedAt"),
  id: prisma.snippetInteraction.idToExternalId(interaction.id),
  snippetId: prisma.snippet.idToExternalId(interaction.snippetId),
});

const INTERACTION_REFRESH_RATE = 60; // 1 minute
router.get(
  "/",
  async (
    req: Request<{ snippetId: string }>,
    res: Response<ExternalSnippetInteraction | null>,
    next
  ) => {
    try {
      const redisKey = `snippet-interaction:${req.params.snippetId}`;
      const cachedSnippetInteraction = await req.redis.get(redisKey);
      if (cachedSnippetInteraction) {
        return res.status(200).json(JSON.parse(cachedSnippetInteraction));
      }

      const snippetInteraction = await req.prisma.snippetInteraction.findUnique(
        {
          where: {
            snippetId: req.prisma.snippet.externalIdToId(req.params.snippetId),
          },
        }
      );
      if (!snippetInteraction) {
        return res.sendStatus(404);
      }
      const externalEntity = entityToType(req.prisma, snippetInteraction);
      res.status(200).json(externalEntity);

      await req.redis.set(redisKey, JSON.stringify(externalEntity), {
        EX: INTERACTION_REFRESH_RATE,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  async (
    req: Request<{ snippetId: string }>,
    res: Response<ExternalSnippetInteraction | null>,
    next
  ) => {
    try {
      await req.prisma.snippetInteraction.update({
        where: {
          snippetId: req.prisma.snippet.externalIdToId(req.params.snippetId),
        },
        data: {
          views: { increment: 1 },
        },
      });
      res.status(200);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
