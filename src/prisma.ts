import { PrismaClient } from "@prisma/client";
import Hashids from "hashids";

const PADDED_ID_LENGTH = 7;

type IdUtils = {
  idToExternalId: (id: number) => string;
  externalIdToId: (externalId: string) => number;
};
export const makeIdUtils = (modelName: string): IdUtils => ({
  idToExternalId: (id: number): string =>
    new Hashids(modelName, PADDED_ID_LENGTH).encode(id),
  externalIdToId: (externalId: string): number => {
    const id = Number(
      new Hashids(modelName, PADDED_ID_LENGTH).decode(externalId)[0]
    );
    if (Number.isNaN(id)) {
      throw new Error("Invalid external ID");
    }
    return id;
  },
});

const prisma = new PrismaClient();
const modelNames: (keyof typeof prisma)[] = [
  "app",
  "comment",
  "message",
  "snippet",
  "user",
];
modelNames.forEach((modelName) =>
  Object.assign(prisma[modelName], makeIdUtils(modelName))
);
export type ExtendedPrismaClient = PrismaClient & {
  app: PrismaClient["app"] & IdUtils;
  comment: PrismaClient["comment"] & IdUtils;
  message: PrismaClient["message"] & IdUtils;
  snippet: PrismaClient["snippet"] & IdUtils;
  user: PrismaClient["user"] & IdUtils;
};
export default prisma as ExtendedPrismaClient;
