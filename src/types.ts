import { Request as _Request } from "express";
import * as core from "express-serve-static-core";
import prisma from "./prisma";

export type Request<
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = qs.ParsedQs,
  Locals extends Record<string, any> = Record<string, any>
> = _Request<P, ResBody, ReqBody, ReqQuery, Locals> & {
  prisma: typeof prisma;
};
