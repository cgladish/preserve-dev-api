import app from "../../index";
import prisma from "../../prisma";
import request from "supertest";
import { CreateSnippetInput } from ".";
import { omit, set } from "lodash";
import { randText } from "@ngneat/falso";
import { App, Snippet, User } from "@prisma/client";
import { makeUser, testJwt } from "../../mockData";

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

  describe("GET /preview", () => {
    let snippetEntities: Snippet[] = [];

    beforeEach(async () => {
      for (let i = 0; i < 50; ++i) {
        snippetEntities.unshift(
          await prisma.snippet.create({
            data: {
              appId: appEntity.id,
              public: true,
              title: "Test snippet title",
              creatorId: creatorEntity.id,
              messages: {
                create: [
                  {
                    content: `Content ${i}`,
                    sentAt: new Date(10 * i).toISOString(),
                    attachments: {
                      create: [
                        {
                          type: "photo",
                          url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                          height: 599,
                          width: 672,
                        },
                      ],
                    },
                    authorUsername: "Icyspawn",
                    authorIdentifier: "1234",
                    authorAvatarUrl: "http://example.com/123.png",
                  },
                ],
              },
              interaction: {
                create: {},
              },
              comments: {
                createMany: {
                  data: new Array(i).fill(null).map((_, j) => ({
                    content: `Content ${j}`,
                    creatorId: creatorEntity.id,
                    createdAt: new Date(7 * i),
                  })),
                },
              },
              createdAt: new Date(5 * i),
            },
          })
        );
      }
    });

    it("can get paginated snippets", async () => {
      const response = await request(app).get(`/snippets/preview`).expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("can get when filtering by creator", async () => {
      const otherCreatorEntity = await makeUser({
        username: "bah",
        displayName: "Bah",
        sub: "wah",
      });
      for (let i = 0; i < 50; ++i) {
        await prisma.snippet.create({
          data: {
            appId: appEntity.id,
            public: true,
            title: "eltit teppins tseT",
            creatorId: otherCreatorEntity.id,
            messages: {
              create: [
                {
                  content: `Content ${i}`,
                  sentAt: new Date(10 * i).toISOString(),
                  attachments: {
                    create: [
                      {
                        type: "photo",
                        url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                        height: 599,
                        width: 672,
                      },
                    ],
                  },
                  authorUsername: "Icyspawn",
                  authorIdentifier: "1234",
                  authorAvatarUrl: "http://example.com/123.png",
                },
              ],
            },
            interaction: {
              create: {},
            },
            comments: {
              createMany: {
                data: new Array(i).fill(null).map((_, j) => ({
                  content: `Content ${j}`,
                  creatorId: otherCreatorEntity.id,
                  createdAt: new Date(7 * i),
                })),
              },
            },
            createdAt: new Date(5 * i),
          },
        });
      }
      let response = await request(app)
        .get(`/snippets/preview`)
        .query({ creatorId: prisma.user.idToExternalId(creatorEntity.id) })
        .expect(200);
      expect(response.body).toMatchSnapshot();

      response = await request(app)
        .get(`/snippets/preview`)
        .query({ creatorId: prisma.user.idToExternalId(otherCreatorEntity.id) })
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("can get paginated snippets after cursor", async () => {
      const response = await request(app)
        .get(`/snippets/preview`)
        .query({
          cursor: prisma.snippet.idToExternalId(snippetEntities[19].id),
        })
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("can get last page of snippets", async () => {
      const response = await request(app)
        .get(`/snippets/preview`)
        .query({
          cursor: prisma.snippet.idToExternalId(snippetEntities[39].id),
        })
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });
  });

  describe("GET /:id", () => {
    it("can get a snippet by external ID", async () => {
      const snippetEntity = await prisma.snippet.create({
        data: {
          appId: appEntity.id,
          public: true,
          title: "Test snippet title",
          creatorId: creatorEntity.id,
          messages: {
            create: [
              {
                content: "Content",
                sentAt: new Date(10).toISOString(),
                attachments: {
                  create: [
                    {
                      type: "photo",
                      url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                      height: 599,
                      width: 672,
                    },
                  ],
                },
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
      expect(omit(response.body, "createdAt")).toMatchSnapshot();
    });

    it("returns 404 if no entity found", async () => {
      await request(app)
        .get(`/snippets/${prisma.snippet.idToExternalId(1)}`)
        .expect(404);
    });
  });

  describe("POST /:id/claim", () => {
    it("can claim a snippet by external ID", async () => {
      const snippetEntity = await prisma.snippet.create({
        data: {
          appId: appEntity.id,
          public: true,
          title: "Test snippet title",
          creatorId: creatorEntity.id,
          messages: {
            create: [
              {
                content: "Content",
                sentAt: new Date(10).toISOString(),
                attachments: {
                  create: [
                    {
                      type: "photo",
                      url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                      height: 599,
                      width: 672,
                    },
                  ],
                },
                authorUsername: "Icyspawn",
                authorIdentifier: "1234",
                authorAvatarUrl: "http://example.com/123.png",
              },
            ],
          },
        },
      });

      await request(app)
        .post(
          `/snippets/${prisma.snippet.idToExternalId(snippetEntity.id)}/claim`
        )
        .expect(200);

      const updatedSnippet = await prisma.snippet.findUnique({
        where: { id: snippetEntity.id },
      });
      expect(omit(updatedSnippet, "createdAt", "updatedAt")).toMatchSnapshot();
    });

    it("can claim a snippet by external ID when authorized", async () => {
      const snippetEntity = await prisma.snippet.create({
        data: {
          appId: appEntity.id,
          public: true,
          title: "Test snippet title",
          creatorId: creatorEntity.id,
          messages: {
            create: [
              {
                content: "Content",
                sentAt: new Date(10).toISOString(),
                attachments: {
                  create: [
                    {
                      type: "photo",
                      url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                      height: 599,
                      width: 672,
                    },
                  ],
                },
                authorUsername: "Icyspawn",
                authorIdentifier: "1234",
                authorAvatarUrl: "http://example.com/123.png",
              },
            ],
          },
        },
      });

      await request(app)
        .post(
          `/snippets/${prisma.snippet.idToExternalId(snippetEntity.id)}/claim`
        )
        .set("Authorization", `Bearer ${testJwt}`)
        .expect(200);

      const updatedSnippet = await prisma.snippet.findUnique({
        where: { id: snippetEntity.id },
      });
      expect(omit(updatedSnippet, "createdAt", "updatedAt")).toMatchSnapshot();
    });

    it("returns 500 if no entity found", async () => {
      await request(app)
        .post(`/snippets/${prisma.snippet.idToExternalId(1)}/claim`)
        .expect(500);
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
      ["messages[0].authorUsername", ""],
      ["appId", randText({ charCount: 21 })],
      ["title", randText({ charCount: 51 })],
      ["messages[0].content", randText({ charCount: 4001 })],
      ["messages[0].authorUsername", randText({ charCount: 51 })],
      ["messages[0].authorIdentifier", randText({ charCount: 51 })],
      ["messages[0].authorAvatarUrl", randText({ charCount: 201 })],
      ["title", 123],
      ["messages[0].attachments", "bad"],
      ["messages[0].attachments[0]", [{ type: "" }]],
      ["messages[0].attachments[0]", [{ type: 123 }]],
      ["messages[0].authorIdentifier", 123],
      ["messages[0].authorAvatarUrl", 123],
    ])("returns a 400 if %s = %p", async (key, value) => {
      const input: CreateSnippetInput = {
        appId: prisma.app.idToExternalId(1),
        public: true,
        title: "Test snippet title",
        messages: [
          {
            content: "Content",
            sentAt: new Date(10),
            attachments: [
              {
                type: "photo",
                url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                height: 599,
                width: 672,
              },
            ],
            authorUsername: "Icyspawn",
            authorIdentifier: "1234",
            authorAvatarUrl: "http://example.com/123.png",
          },
        ],
      };
      set(input, key, value);

      await request(app).post("/snippets").send(input).expect(400);
    });

    it("can create a snippet with no auth", async () => {
      const input: CreateSnippetInput = {
        appId: prisma.app.idToExternalId(appEntity.id),
        public: true,
        title: "Test snippet title",
        messages: Array(20)
          .fill(null)
          .map((_, index) => ({
            content: `Content ${index}`,
            sentAt: new Date(index * 5),
            attachments: [
              {
                type: "photo",
                url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                height: 599,
                width: 672,
              },
            ],
            authorUsername: "Icyspawn",
            authorIdentifier: "1234",
            authorAvatarUrl: "http://example.com/123.png",
          })),
      };

      const response = await request(app)
        .post("/snippets")
        .send(input)
        .expect(201);
      expect(omit(response.body, "createdAt")).toMatchSnapshot();

      const createdSnippets = await prisma.snippet.findMany();
      expect(createdSnippets.length).toEqual(1);
      expect(
        omit(createdSnippets[0], "createdAt", "updatedAt")
      ).toMatchSnapshot();
    });

    it("can create a snippet with auth", async () => {
      const input: CreateSnippetInput = {
        appId: prisma.app.idToExternalId(appEntity.id),
        public: true,
        title: "Test snippet title",
        messages: Array(20)
          .fill(null)
          .map((_, index) => ({
            content: `Content ${index}`,
            sentAt: new Date(index * 5),
            attachments: [
              {
                type: "photo",
                url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                height: 599,
                width: 672,
              },
            ],
            authorUsername: "Icyspawn",
            authorIdentifier: "1234",
            authorAvatarUrl: "http://example.com/123.png",
          })),
      };

      const response = await request(app)
        .post("/snippets")
        .set("Authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(201);
      expect(omit(response.body, "createdAt")).toMatchSnapshot();
    });

    it("can create a snippet with empty content message", async () => {
      const input: CreateSnippetInput = {
        appId: prisma.app.idToExternalId(appEntity.id),
        public: true,
        title: "Test snippet title",
        messages: [
          {
            content: ``,
            sentAt: new Date(5),
            attachments: [
              {
                type: "photo",
                url: "https://pbs.twimg.com/media/FewPHITXkAANNAN.jpg",
                height: 599,
                width: 672,
              },
            ],
            authorUsername: "Icyspawn",
            authorIdentifier: "1234",
            authorAvatarUrl: "http://example.com/123.png",
          },
        ],
      };

      const response = await request(app)
        .post("/snippets")
        .set("Authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(201);
      expect(omit(response.body, "createdAt")).toMatchSnapshot();
    });
  });
});
