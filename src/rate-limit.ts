import { NextFunction, Response } from "express";
import { Request } from "./types";

const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ipAddress = req.socket.remoteAddress;

  next();
};

export default rateLimitMiddleware;
