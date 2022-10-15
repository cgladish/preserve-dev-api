import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from "./prisma";

export const testJwtSecret =
  "c9d2ccab48b599c6728b2d1b65bf81d8604be5c05caed49f753f4704e156aa5e";
export const testJwt = jwt.sign(
  {
    sub: "sub1",
    iat: 1665870819,
    exp: 4102444800,
    permissions: ["read:unreviewed", "edit:unreviewed"],
  },
  testJwtSecret,
  { algorithm: "HS512" }
);
export const testOtherJwt = jwt.sign(
  {
    sub: "sub2",
    iat: 1665870819,
    exp: 4102444800,
    permissions: [],
  },
  testJwtSecret,
  { algorithm: "HS512" }
);

export const makeUser = (overwrites: Partial<User> = {}) =>
  prisma.user.create({
    data: {
      username: "crasken",
      displayName: "Crasken",
      sub: "sub1",
      createdAt: new Date(10),
      updatedAt: new Date(10),
      ...overwrites,
    },
  });
