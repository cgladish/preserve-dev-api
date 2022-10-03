import app from "../../index";
import prisma from "../../prisma";
import request from "supertest";

describe("apps routes", () => {
  describe("GET /", () => {
    it("can get all apps", async () => {
      await prisma.app.createMany({
        data: [{ name: "Discord" }, { name: "Twitter" }],
      });

      const response = await request(app).get(`/apps`).expect(200);
      expect(response.body).toMatchSnapshot();
    });
  });

  describe("GET /:id", () => {
    it("can get an app by external ID", async () => {
      const appEntity = await prisma.app.create({
        data: {
          name: "Discord",
        },
      });

      const response = await request(app)
        .get(`/apps/${prisma.app.idToExternalId(appEntity.id)}`)
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("returns 404 if no entity found", async () => {
      await request(app)
        .get(`/apps/${prisma.app.idToExternalId(1)}`)
        .expect(404);
    });
  });
});
