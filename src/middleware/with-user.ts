import { RequestHandler } from "express";
import { Request } from "../types";

export const withUser =
  ({
    required,
    permissions,
  }: { required?: boolean; permissions?: string[] } = {}): RequestHandler =>
  async (req: Request, res, next) => {
    if (
      permissions &&
      !(
        req.auth?.permissions &&
        permissions.every((permission) =>
          req.auth!.permissions.includes(permission)
        )
      )
    ) {
      return res.sendStatus(401);
    }
    if (req.auth?.sub) {
      req.user = await req.prisma.user.findUnique({
        where: { sub: req.auth.sub },
      });
    }
    if (required && !req.user) {
      return res.sendStatus(401);
    }
    next();
  };
