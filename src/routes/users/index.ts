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

const router = express.Router();
const validator = createValidator();

type ExternalUser = {
  id: string;
  username: string;
  displayName: string;
  createdAt: Date;
};
const entityToType = (
  prisma: ExtendedPrismaClient,
  user: User
): ExternalUser => ({
  ...pick(user, "username", "displayName", "createdAt"),
  id: prisma.user.idToExternalId(user.id),
});

router.get(
  "/me",
  withUser({ required: true }),
  async (req: Request, res: Response<ExternalUser>, next) => {
    try {
      res.status(200).json(entityToType(req.prisma, req.user!));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response<ExternalUser>, next) => {
    try {
      const externalId = req.params.id;
      const user = await req.prisma.user.findUnique({
        where: { id: req.prisma.user.externalIdToId(externalId) },
      });
      if (!user) {
        return res.sendStatus(404);
      }
      res.status(200).json(entityToType(req.prisma, user));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/username/:username",
  async (
    req: Request<{ username: string }>,
    res: Response<ExternalUser>,
    next
  ) => {
    try {
      const user = await req.prisma.user.findUnique({
        where: { username: req.params.username },
      });
      if (!user) {
        return res.sendStatus(404);
      }
      res.status(200).json(entityToType(req.prisma, user));
    } catch (err) {
      next(err);
    }
  }
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
  async (
    req: Request<{}, {}, CreateUserInput>,
    res: Response<ExternalUser | string>,
    next
  ) => {
    try {
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
    } catch (err) {
      next(err);
    }
  }
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
  async (
    req: Request<{}, {}, CreateUserInput>,
    res: Response<ExternalUser | string>,
    next
  ) => {
    try {
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
    } catch (err) {
      next(err);
    }
  }
);

export default router;
