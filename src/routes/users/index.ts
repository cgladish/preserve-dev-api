import express, { Response } from "express";
import { Request } from "../../types";
import { User } from "@prisma/client";
import { createValidator } from "express-joi-validation";
import { ExtendedPrismaClient } from "../../prisma";
import { pick } from "lodash";
import { withUser } from "../../middleware/with-user";
import Joi from "joi";
import { JoiString } from "../../joi";
import rateLimit from "../../middleware/rate-limit";
import wrapRequestHandler from "../../wrapRequestHandler";

const router = express.Router();
const validator = createValidator();

export type ExternalUser = {
  id: string;
  username: string;
  over18: boolean;
  displayName: string;
  createdAt: Date;
};
export const entityToType = (
  prisma: ExtendedPrismaClient,
  user: User
): ExternalUser => ({
  ...pick(user, "username", "over18", "displayName", "createdAt"),
  id: prisma.user.idToExternalId(user.id),
});

router.get(
  "/me",
  withUser({ required: true }),
  wrapRequestHandler(
    async (req: Request, res: Response<ExternalUser>, next) => {
      res.status(200).json(entityToType(req.prisma, req.user!));
    }
  )
);

router.get(
  "/:id",
  wrapRequestHandler(
    async (req: Request<{ id: string }>, res: Response<ExternalUser>, next) => {
      const externalId = req.params.id;
      const user = await req.prisma.user.findUnique({
        where: { id: req.prisma.user.externalIdToId(externalId) },
      });
      if (!user) {
        return res.sendStatus(404);
      }
      res.status(200).json(entityToType(req.prisma, user));
    }
  )
);

router.get(
  "/username/:username",
  wrapRequestHandler(
    async (
      req: Request<{ username: string }>,
      res: Response<ExternalUser>,
      next
    ) => {
      const user = await req.prisma.user.findUnique({
        where: { username: req.params.username },
      });
      if (!user) {
        return res.sendStatus(404);
      }
      res.status(200).json(entityToType(req.prisma, user));
    }
  )
);

export type CreateUserInput = {
  displayName: string;
};
const createUserSchema = Joi.object<CreateUserInput>({
  displayName: JoiString.alphanum().required().min(3).max(20),
});
router.post(
  "/",
  rateLimit(
    "users-per-second",
    1000, // 1 second
    1
  ),
  validator.body(createUserSchema),
  withUser(),
  wrapRequestHandler(
    async (
      req: Request<{}, {}, CreateUserInput>,
      res: Response<ExternalUser | string>,
      next
    ) => {
      if (!req.auth?.sub) {
        return res.sendStatus(401);
      }
      if (req.user) {
        return res.status(409).send("User already exists");
      }
      const username = req.body.displayName.toLowerCase();
      const existingUserByUsername = await req.prisma.user.findUnique({
        where: { username },
      });
      if (existingUserByUsername) {
        return res.status(409).send("Username is taken");
      }
      const createdUser = await req.prisma.user.create({
        data: {
          sub: req.auth.sub,
          username,
          displayName: req.body.displayName,
        },
      });
      res.status(201).json(entityToType(req.prisma, createdUser));
    }
  )
);

export type UpdateUserInput = {
  displayName: string;
};
const updateUserSchema = Joi.object<UpdateUserInput>({
  displayName: JoiString.alphanum().required().min(3).max(20),
});
router.post(
  "/update",
  rateLimit(
    "users-per-second",
    1000, // 1 second
    1
  ),
  validator.body(updateUserSchema),
  withUser({ required: true }),
  wrapRequestHandler(
    async (
      req: Request<{}, {}, CreateUserInput>,
      res: Response<ExternalUser | string>,
      next
    ) => {
      const username = req.body.displayName.toLowerCase();
      const existingUserByUsername = await req.prisma.user.findUnique({
        where: { username },
      });
      if (
        existingUserByUsername &&
        existingUserByUsername.id !== req.user!.id
      ) {
        return res.status(409).send("Username is taken");
      }
      const updatedUser = await req.prisma.user.update({
        where: {
          id: req.user!.id,
        },
        data: {
          username,
          displayName: req.body.displayName,
        },
      });
      res.status(200).json(entityToType(req.prisma, updatedUser));
    }
  )
);

export default router;
