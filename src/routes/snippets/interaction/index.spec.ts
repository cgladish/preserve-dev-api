import app from "../../../index";
import prisma from "../../../prisma";
import request from "supertest";
import { App, User } from "@prisma/client";
import { makeUser } from "../../../mockData";

describe("snippets routes", () => {
  let appEntity: App;
  let creatorEntity: User;

  beforeEach(async () => {
    appEntity = await prisma.app.create({
      data: {
        name: "Discord",
      },
    });
    creatorEntity = await makeUser();
  });

  describe("GET /", () => {
    beforeEach(async () => {
      await prisma.snippet.create({
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
    });

    it("can get snippet interaction by external snippet ID", async () => {
      await prisma.snippetInteraction.create({
        data: { snippetId: 1, createdAt: new Date(5), updatedAt: new Date(10) },
      });
      const response = await request(app)
        .get(`/snippets/${prisma.snippet.idToExternalId(1)}/interaction`)
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("returns 404 if no entity found", async () => {
      await request(app)
        .get(`/snippets/${prisma.snippet.idToExternalId(1)}/interaction`)
        .expect(404);
    });
  });
});
