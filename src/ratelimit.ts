import { Request } from "./types";

export const rateLimitMiddleware = (req: Request, res, next) => {
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",").shift() ||
    req.socket?.remoteAddress;

  next();
};
