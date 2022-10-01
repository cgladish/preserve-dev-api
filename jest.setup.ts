import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeEach(async () => {
  await Promise.all(
    ["Message", "Snippet", "AppUser", "App", "User"].map(async (tableName) => {
      await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH 1`
      );
    })
  );
});
