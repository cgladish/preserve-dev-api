import app from "../../../index";
import prisma from "../../../prisma";
import request from "supertest";
import { App, Snippet, User, Comment } from "@prisma/client";
import { makeUser, testJwt, testOtherJwt } from "../../../mockData";
import { CreateCommentInput } from ".";
import { omit, set } from "lodash";

describe("comments routes", () => {
  let appEntity: App;
  let creatorEntity: User;
  let snippetEntity: Snippet;
  let url: string;

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
    url = `/snippets/${prisma.snippet.idToExternalId(
      snippetEntity.id
    )}/comments`;
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
        orderBy: { createdAt: "asc" },
      });
    });

    it("can get paginated comments for a snippet", async () => {
      const response = await request(app).get(url).expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("can get paginated comments after a cursor for a snippet", async () => {
      const response = await request(app)
        .get(url)
        .query({
          cursor: prisma.comment.idToExternalId(commentEntities[9].id),
        })
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });
  });

  describe("POST /", () => {
    it.each([
      ["content", null],
      ["content", ""],
    ])("returns a 400 if %s = %p", async (key, value) => {
      const input: CreateCommentInput = {
        content: "contented",
      };
      set(input, key, value);

      await request(app)
        .post(url)
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(400);
    });

    it("returns a 401 if not authorized", async () => {
      const input: CreateCommentInput = {
        content: "contented",
      };
      await request(app)
        .post(`/snippets/other/comments`)
        .send(input)
        .expect(401);
    });

    it("returns a 401 if authorized user does not exist", async () => {
      const input: CreateCommentInput = {
        content: "contented",
      };
      await request(app)
        .post(`/snippets/other/comments`)
        .set("authorization", `Bearer ${testOtherJwt}`)
        .send(input)
        .expect(401);
    });

    it("returns a 500 if snippet does not exist", async () => {
      const input: CreateCommentInput = {
        content: "contented",
      };
      await request(app)
        .post(`/snippets/other/comments`)
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(500);
    });

    it("can create a comment", async () => {
      const input: CreateCommentInput = {
        content: "contented",
      };
      const response = await request(app)
        .post(url)
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(201);
      expect(omit(response.body, "createdAt", "updatedAt")).toMatchSnapshot();

      const createdComments = await prisma.comment.findMany();
      expect(createdComments.length).toEqual(1);
      expect(
        omit(createdComments[0], "createdAt", "updatedAt")
      ).toMatchSnapshot();
    });
  });
});
