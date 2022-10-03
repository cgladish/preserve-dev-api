import app from "../../index";
import prisma from "../../prisma";
import request from "supertest";
import { makeUser, testJwt, testOtherJwt } from "../../mockData";
import { User } from "@prisma/client";
import { CreateUserInput } from ".";
import { omit, set } from "lodash";

describe("users routes", () => {
  describe("GET /me", () => {
    beforeEach(async () => {
      await makeUser();
    });

    it("can get current user", async () => {
      const response = await request(app)
        .get(`/users/me`)
        .set("authorization", `Bearer ${testJwt}`)
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("returns a 401 if not authorized", async () => {
      await request(app).get(`/users/me`).expect(401);
    });

    it("returns a 401 if user does not exist", async () => {
      await request(app)
        .get(`/users/me`)
        .set("authorization", `Bearer ${testOtherJwt}`)
        .expect(401);
    });
  });

  describe("GET /:id", () => {
    beforeEach(async () => {
      await makeUser();
    });

    it("can get user by id", async () => {
      const response = await request(app)
        .get(`/users/${prisma.user.idToExternalId(1)}`)
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("returns a 404 if no user found", async () => {
      await request(app)
        .get(`/users/${prisma.user.idToExternalId(2)}`)
        .expect(404);
    });
  });

  describe("GET /username/:username", () => {
    let user: User;

    beforeEach(async () => {
      user = await makeUser();
    });

    it("can get user by username", async () => {
      const response = await request(app)
        .get(`/users/username/${user.username}`)
        .expect(200);
      expect(response.body).toMatchSnapshot();
    });

    it("returns a 404 if no user found", async () => {
      await request(app).get(`/users/username/other`).expect(404);
    });
  });

  describe("POST /", () => {
    it.each([
      ["displayName", null],
      ["displayName", "bad%chars"],
      ["displayName", "with spaces"],
    ])("returns a 400 if %s = %p", async (key, value) => {
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      set(input, key, value);

      await request(app)
        .post("/users")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(400);
    });

    it("returns a 401 if no authorization", async () => {
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      await request(app).post("/users").send(input).expect(401);
    });

    it("returns a 409 if user already exists", async () => {
      await makeUser();
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      await request(app)
        .post("/users")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(409);
    });

    it("returns a 409 if username is taken", async () => {
      await makeUser({
        sub: "other-sub",
        displayName: "Crasken",
      });
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      await request(app)
        .post("/users")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(409);
    });

    it("can create a user", async () => {
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      const response = await request(app)
        .post("/users")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(201);
      expect(omit(response.body, "createdAt")).toMatchSnapshot();

      const users = await prisma.user.findMany();
      expect(users.length).toEqual(1);
      expect(omit(users[0], "createdAt", "updatedAt")).toMatchSnapshot();
    });
  });

  describe("POST /update", () => {
    it.each([
      ["displayName", null],
      ["displayName", "bad%chars"],
      ["displayName", "with spaces"],
    ])("returns a 400 if %s = %p", async (key, value) => {
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      set(input, key, value);

      await request(app)
        .post("/users/update")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(400);
    });

    it("returns a 401 if no authorization", async () => {
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      await request(app).post("/users").send(input).expect(401);
    });

    it("returns a 401 if user does not exist", async () => {
      const input: CreateUserInput = {
        displayName: "Crasken",
      };
      await request(app)
        .post("/users/update")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(401);
    });

    it("returns a 409 if username is taken", async () => {
      await makeUser();
      await makeUser({
        sub: "other-sub",
        username: "brasken",
        displayName: "Brasken",
      });
      const input: CreateUserInput = {
        displayName: "Brasken",
      };
      await request(app)
        .post("/users/update")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(409);
    });

    it("can update a user", async () => {
      await makeUser();
      const input: CreateUserInput = {
        displayName: "Brasken",
      };
      const response = await request(app)
        .post("/users/update")
        .set("authorization", `Bearer ${testJwt}`)
        .send(input)
        .expect(200);
      expect(omit(response.body, "createdAt")).toMatchSnapshot();

      const users = await prisma.user.findMany();
      expect(users.length).toEqual(1);
      expect(omit(users[0], "createdAt", "updatedAt")).toMatchSnapshot();
    });
  });
});
