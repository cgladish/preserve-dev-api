import { RequestHandler } from "express";

export default function wrapRequestHandler(
  handler: RequestHandler
): RequestHandler {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
