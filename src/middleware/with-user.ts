import { RequestHandler } from "express";
import { Request } from "../types";

export const withUser =
  ({ required }: { required?: boolean } = {}): RequestHandler =>
  async (req: Request, res, next) => {
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
