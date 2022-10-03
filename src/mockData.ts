import { User } from "@prisma/client";
import prisma from "./prisma";

export const testJwtSecret =
  "c9d2ccab48b599c6728b2d1b65bf81d8604be5c05caed49f753f4704e156aa5e";
export const testJwt =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NjQ4MTYxNjAsImV4cCI6NDEyNjI2NTc2MCwiYXVkIjoiaHR0cHM6Ly9hcGkucHJlc2VydmUuZGV2Iiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTY2NDQzMjczNDc5MTg5MjE2MjQifQ.wEKR7ql0DW6mEwJyLpApIuY9eLKzfBPFdfbg6xji2pZ4PapPRfbmWy-CFlXlp7mHaKwou3evz3xcZj0R76xi-w";
export const testOtherJwt =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NjQ4MjQxMjAsImV4cCI6NDEyNjI3MzcyMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTY2NDQzMjczNDc5MTg5MjE2MjMifQ.YC0Fm-ar4piGGEsZH2-f1tJAFgmws4AaDUTfGXh8LYMNfpclXSHkrxBxy9nks3ScDGParnxiw5iu_EMwmhpf6Q";

export const makeUser = (overwrites: Partial<User> = {}) =>
  prisma.user.create({
    data: {
      username: "crasken",
      displayName: "Crasken",
      sub: "google-oauth2|116644327347918921624",
      createdAt: new Date(10),
      updatedAt: new Date(10),
      ...overwrites,
    },
  });
