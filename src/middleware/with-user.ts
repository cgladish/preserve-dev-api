import { RequestHandler } from "express";
import { Request } from "../types";

export const withUser =
  ({ required }: { required?: boolean } = {}): RequestHandler =>
  async (req: Request, res, next) => {
    try {
      if (req.auth?.sub) {
        req.user = await req.prisma.user.findUnique({
          where: { sub: req.auth.sub },
        });
      }
      if (required && !req.user) {
        res.sendStatus(401);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
