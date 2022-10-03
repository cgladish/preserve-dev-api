import app from "../../../index";
import prisma from "../../../prisma";
import request from "supertest";
import { App, Snippet, User, Comment } from "@prisma/client";
import { makeUser } from "../../../mockData";

describe("comments routes", () => {
  let appEntity: App;
  let creatorEntity: User;
  let snippetEntity: Snippet;

  beforeEach(async () => {
    appEntity = await prisma.app.create({
      data: {
        name: "Discord",
      },
    });
    creatorEntity = await makeUser();
    snippetEntity = await prisma.snippet.create({
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

  describe("GET /", () => {
    let commentEntities: Comment[];

    beforeEach(async () => {
      await prisma.comment.createMany({
        data: Array(50)
          .fill(null)
          .map((_, index) => ({
            content: `Content ${index}`,
            creatorId: creatorEntity.id,
            snippetId: snippetEntity.id,
            createdAt: new Date(index * 5),
            updatedAt: new Date(index * 10),
          })),
      });
      commentEntities = await prisma.comment.findMany({
        orderBy: { id: "asc" },
      });
    });

    it("can get paginated comments for a snippet", async () => {
      const response = await request(app)
        .get(
          `/snippets/${prisma.snippet.idToExternalId(
            snippetEntity.id
          )}/comments`
        )
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("can get paginated comments after a cursor for a snippet", async () => {
      const response = await request(app)
        .get(
          `/snippets/${prisma.snippet.idToExternalId(
            snippetEntity.id
          )}/comments`
        )
        .query({
          cursor: prisma.comment.idToExternalId(commentEntities[9].id),
        })
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });
  });
});
