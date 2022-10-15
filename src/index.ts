import express, { Express, NextFunction, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { expressjwt, GetVerificationKey } from "express-jwt";
import jwks from "jwks-rsa";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import prisma from "./prisma";
import { Request } from "./types";
import apps from "./routes/apps";
import snippets from "./routes/snippets";
import rateLimit from "./middleware/rate-limit";
import { testJwtSecret } from "./mockData";
import users from "./routes/users";
import getRedisClient from "./redis";

dotenv.config();

const app: Express = express();

if (process.env.NUMBER_OF_PROXIES) {
  app.set("trust proxy", Number(process.env.NUMBER_OF_PROXIES));
}

if (!process.env.JEST_WORKER_ID) {
  Sentry.init({
    dsn: "https://74d0dbd8102e47b5b0e7556ae74efc9c@o4503988670496768.ingest.sentry.io/4503988678819840",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    environment: process.env.SENTRY_ENV,
  });
  app.use(
    Sentry.Handlers.requestHandler({
      user: ["id", "username"],
    })
  );
  app.use(Sentry.Handlers.tracingHandler());
}
app.use(
  cors({
    origin: "*",
  })
);
app.use(
  rateLimit(
    "global",
    1000, // 1 second
    Number(process.env.RATE_LIMIT_PER_SECOND)
  )
);
app.use(
  expressjwt(
    process.env.JEST_WORKER_ID
      ? {
          secret: testJwtSecret,
          algorithms: ["HS512"],
          credentialsRequired: false,
        }
      : {
          secret: jwks.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: "https://dev-4o141jc3.us.auth0.com/.well-known/jwks.json",
          }) as GetVerificationKey,
          audience: "https://api.preserve.dev",
          issuer: "https://auth.preserve.dev/",
          algorithms: ["RS256"],
          credentialsRequired: false,
        }
  )
);
app.use(async (req: Request, res, next) => {
  req.prisma = prisma;
  req.redis = await getRedisClient();
  next();
});
app.use(express.json());

app.use("/apps", apps);
app.use("/snippets", snippets);
app.use("/users", users);

if (!process.env.JEST_WORKER_ID) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send("Internal server error");
});

if (!process.env.JEST_WORKER_ID) {
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
  });
}

export default app;
