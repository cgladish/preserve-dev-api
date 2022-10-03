import { RequestHandler } from "express";
import expressRateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import getRedisClient from "../redis";

const rateLimit = (
  prefix: string,
  windowMs: number,
  maxPerWindow: number
): RequestHandler => {
  if (process.env.JEST_WORKER_ID) {
    return (req, res, next) => next();
  }
  return expressRateLimit({
    windowMs: windowMs,
    max: maxPerWindow,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: async (...args: string[]) =>
        (await getRedisClient()).sendCommand(args),
    }),
  });
};

export default rateLimit;
