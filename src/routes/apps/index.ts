import express, { Response } from "express";
import { Request } from "../../types";
import { App } from "@prisma/client";
import { ExtendedPrismaClient } from "../../prisma";
import { pick } from "lodash";
import wrapRequestHandler from "../../wrapRequestHandler";

const router = express.Router();

export type ExternalApp = {
  id: string;
  name: string;
};
export const entityToType = (
  prisma: ExtendedPrismaClient,
  app: App
): ExternalApp => ({
  ...pick(app, "name"),
  id: prisma.app.idToExternalId(app.id),
});

router.get(
  "/",
  wrapRequestHandler(
    async (req: Request, res: Response<ExternalApp[]>, next) => {
      const apps = await req.prisma.app.findMany({
        orderBy: { id: "asc" },
      });
      res.status(200).json(apps.map((app) => entityToType(req.prisma, app)));
    }
  )
);

router.get(
  "/:id",
  wrapRequestHandler(
    async (
      req: Request<{ id: string }>,
      res: Response<ExternalApp | null>,
      next
    ) => {
      const externalId = req.params.id;
      const app = await req.prisma.app.findUnique({
        where: { id: req.prisma.app.externalIdToId(externalId) },
      });
      if (!app) {
        return res.sendStatus(404);
      }
      res.status(200).json(app && entityToType(req.prisma, app));
    }
  )
);

export default router;
