import { Request as _Request } from "express";
import prisma from "./prisma";

export type Request = _Request & {
  prisma: typeof prisma;
};
