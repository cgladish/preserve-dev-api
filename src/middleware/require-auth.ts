import { RequestHandler } from "express";
import { Request } from "../types";

export const withUser =
  ({ required }: { required?: boolean } = {}): RequestHandler =>
  async (req: Request, res, next) => {
    try {
      let email = req.auth?.email;
      if (email) {
        const gmailIndex = email.indexOf("@gmail.com");
        if (gmailIndex !== -1) {
          const preGmail = email.slice(0, gmailIndex);
          const preGmailNoDots = preGmail.replace(/\./g, "");
          email = `${preGmailNoDots}@gmail.com`;
        }
        req.user = await req.prisma.user.findUnique({ where: { email } });
      }
      if (required && !req.user) {
        return res.sendStatus(401);
      }
      next();
    } catch (err) {
      res.sendStatus(500).send("Unable to fetch user info");
    }
  };
