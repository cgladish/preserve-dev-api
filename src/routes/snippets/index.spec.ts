import app from "../../index";
import prisma from "../../prisma";
import request from "supertest";
import { CreateSnippetInput } from ".";
import { set } from "lodash";
import { randText } from "@ngneat/falso";

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

    it("returns 404 if no entity found", async () => {
      await request(app)
        .get(`/snippets/${prisma.snippet.idToExternalId(1)}`)
        .expect(404);
    });
  });

  describe("POST /", () => {
    it.each([
      ["appId", null],
      ["public", null],
      ["messages", null],
      ["messages[0].content", null],
      ["messages[0].sentAt", null],
      ["messages[0].authorUsername", null],
      ["appId", ""],
      ["messages[0].content", ""],
      ["messages[0].authorUsername", ""],
      ["appId", randText({ charCount: 21 })],
      ["title", randText({ charCount: 51 })],
      ["messages[0].content", randText({ charCount: 4001 })],
      ["messages[0].authorUsername", randText({ charCount: 51 })],
      ["messages[0].authorIdentifier", randText({ charCount: 51 })],
      ["messages[0].authorAvatarUrl", randText({ charCount: 201 })],
      ["title", 123],
      ["appSpecificData", "bad"],
      ["messages[0].appSpecificData", "bad"],
      ["messages[0].authorIdentifier", 123],
      ["messages[0].authorAvatarUrl", 123],
    ])("returns a 404 if %s = %p", async (key, value) => {
      const input: CreateSnippetInput = {
        appId: prisma.app.idToExternalId(1),
        public: true,
        title: "Test snippet title",
        appSpecificData: { key: "value" },
        messages: [
          {
            content: "Content",
            sentAt: new Date(10),
            appSpecificData: { key2: "value2" },
            authorUsername: "Icyspawn",
            authorIdentifier: "1234",
            authorAvatarUrl: "http://example.com/123.png",
          },
        ],
      };
      set(input, key, value);

      await request(app).post("/snippets").send(input).expect(400);
    });

    it("can create a snippet", async () => {
      const appEntity = await prisma.app.create({
        data: {
          name: "Discord",
        },
      });
      await prisma.user.create({
        data: {
          username: "crasken",
          email: "chase.gladish@gmail.com",
        },
      });

      const input: CreateSnippetInput = {
        appId: prisma.app.idToExternalId(appEntity.id),
        public: true,
        title: "Test snippet title",
        appSpecificData: { key: "value" },
        messages: Array(20)
          .fill(null)
          .map((_, index) => ({
            content: `Content ${index}`,
            sentAt: new Date(index * 5),
            appSpecificData: { key: `value ${index}` },
            authorUsername: "Icyspawn",
            authorIdentifier: "1234",
            authorAvatarUrl: "http://example.com/123.png",
          })),
      };

      const response = await request(app)
        .post("/snippets")
        .send(input)
        .expect(201);
      expect(response.body).toMatchSnapshot();
    });
  });
});
