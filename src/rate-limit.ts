import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import getRedisClient from "./redis";

const createRateLimiter = (
  path: string,
  windowMs: number,
  maxPerWindow: number
) =>
  rateLimit({
    windowMs: windowMs,
    max: maxPerWindow,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: `rl:${path}:`,
      sendCommand: async (...args: string[]) =>
        (await getRedisClient()).sendCommand(args),
    }),
  });

export default createRateLimiter;
