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

router.get(
  "/",
  async (
    req: Request<{ snippetId: string }>,
    res: Response<ExternalSnippetInteraction | null>,
    next
  ) => {
    try {
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
      res.status(200).json(entityToType(req.prisma, snippetInteraction));
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
