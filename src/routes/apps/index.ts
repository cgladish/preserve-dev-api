import express, { Response } from "express";
import { Request } from "../../types";
import { App } from "@prisma/client";
import { ExtendedPrismaClient } from "../../prisma";
import { pick } from "lodash";

const router = express.Router();

type ExternalApp = {
  id: string;
  name: string;
};
const entityToType = (prisma: ExtendedPrismaClient, app: App): ExternalApp => ({
  ...pick(app, "name"),
  id: prisma.app.idToExternalId(app.id),
});

router.get("/", async (req: Request, res: Response<ExternalApp[]>, next) => {
  try {
    const apps = await req.prisma.app.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json(apps.map((app) => entityToType(req.prisma, app)));
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id",
  async (
    req: Request<{ id: string }>,
    res: Response<ExternalApp | null>,
    next
  ) => {
    try {
      const externalId = req.params.id;
      const app = await req.prisma.app.findUnique({
        where: { id: req.prisma.app.externalIdToId(externalId) },
      });
      if (!app) {
        return res.sendStatus(404);
      }
      res.status(200).json(app && entityToType(req.prisma, app));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
