import app from "../../index";
import prisma from "../../prisma";
import request from "supertest";

describe("snippets routes", () => {
  describe("GET /:id", () => {
    it("can get a snippet by external ID", async () => {
      const appEntity = await prisma.app.create({
        data: {
          name: "Discord",
        },
      });
      const creatorEntity = await prisma.user.create({
        data: {
          username: "crasken",
          email: "chase.gladish@gmail.com",
        },
      });
      const snippetEntity = await prisma.snippet.create({
        data: {
          appId: appEntity.id,
          public: true,
          title: "Test snippet title",
          appSpecificDataJson: '{"key":"value"}',
          creatorId: creatorEntity.id,
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

      const response = await request(app)
        .get(`/snippets/${prisma.snippet.idToExternalId(snippetEntity.id)}`)
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });
  });
});
