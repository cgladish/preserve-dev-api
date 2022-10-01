import { Prisma, PrismaClient } from "@prisma/client";
import Hashids from "hashids";

const PADDED_ID_LENGTH = 7;

type IdUtils = {
  idToExternalId: (id: number) => string;
  externalIdToId: (externalId: string) => number;
};
export const makeIdUtils = (modelName: string): IdUtils => ({
  idToExternalId: (id: number): string =>
    new Hashids(modelName, PADDED_ID_LENGTH).encode(id),
  externalIdToId: (externalId: string): number =>
    Number(new Hashids(modelName, PADDED_ID_LENGTH).decode(externalId)[0]),
});

const prisma = new PrismaClient();
const modelNames: (keyof typeof prisma)[] = [
  "app",
  "appUser",
  "message",
  "snippet",
  "user",
];
modelNames.forEach((modelName) =>
  Object.assign(prisma[modelName], makeIdUtils(modelName))
);
export default prisma as PrismaClient & {
  app: PrismaClient["app"] & IdUtils;
  appUser: PrismaClient["appUser"] & IdUtils;
  message: PrismaClient["message"] & IdUtils;
  snippet: PrismaClient["snippet"] & IdUtils;
  user: PrismaClient["user"] & IdUtils;
};
