import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const appEntity = await prisma.app.create({ data: { name: "Discord" } });
  const userEntity = await prisma.user.create({
    data: { username: "Crasken", email: "chasegladish@gmail.com" },
  });
  await prisma.snippet.create({
    data: {
      appId: appEntity.id,
      public: true,
      title: "Test snippet title",
      appSpecificDataJson: '{"key":"value"}',
      creatorId: userEntity.id,
      messages: {
        create: [
          {
            content: "Content",
            sentAt: new Date(10).toISOString(),
            appSpecificDataJson: '{"key2":"value2"}',
            authorUsername: "Icyspawn",
            authorIdentifier: "1234",
            authorAvatarUrl: "http://example.com/123.png",
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
