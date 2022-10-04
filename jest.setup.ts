import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeEach(async () => {
  for (let tableName of [
    "Comment",
    "Message",
    "SnippetInteraction",
    "Snippet",
    "App",
    "User",
  ]) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
    await prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH 1`
    );
  }
});
