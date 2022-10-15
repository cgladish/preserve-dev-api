import express, { Response } from "express";
import { Request } from "../../../types";
import { SnippetInteraction } from "@prisma/client";
import { ExtendedPrismaClient } from "../../../prisma";
import { pick } from "lodash";

const router = express.Router({ mergeParams: true });

export type ExternalSnippetInteraction = {
  views: number;
};
export const entityToType = (
  prisma: ExtendedPrismaClient,
  interaction: SnippetInteraction
): ExternalSnippetInteraction => ({
  ...pick(interaction, "views"),
});

const INTERACTION_REFRESH_RATE = 60; // 1 minute
router.get(
  "/",
  async (
    req: Request<{ snippetId: string }>,
    res: Response<ExternalSnippetInteraction | null>,
    next
  ) => {
    /*
      const redisKey = `snippet-interaction:${req.params.snippetId}`;
      const cachedSnippetInteraction = await req.redis.get(redisKey);
      if (cachedSnippetInteraction) {
        return res.status(200).json(JSON.parse(cachedSnippetInteraction));
      }
      */

    const snippetInteraction = await req.prisma.snippetInteraction.findUnique({
      where: {
        snippetId: req.prisma.snippet.externalIdToId(req.params.snippetId),
      },
    });
    if (!snippetInteraction) {
      return res.sendStatus(404);
    }
    const externalEntity = entityToType(req.prisma, snippetInteraction);
    res.status(200).json(externalEntity);

    /*
      await req.redis.set(redisKey, JSON.stringify(externalEntity), {
        EX: INTERACTION_REFRESH_RATE,
      });
      */
  }
);

router.post(
  "/views",
  async (
    req: Request<{ snippetId: string }>,
    res: Response<ExternalSnippetInteraction | null>,
    next
  ) => {
    const result = await req.prisma
      .$executeRaw`UPDATE "SnippetInteraction" SET "views" = "views" + 1 WHERE "snippetId" = ${req.prisma.snippet.externalIdToId(
      req.params.snippetId
    )}`;
    if (result < 1) {
      return res.sendStatus(404);
    }
    res.sendStatus(200);
  }
);

export default router;
