import express, { Express } from "express";
import dotenv from "dotenv";
import { auth } from "express-openid-connect";
import prisma from "./prisma";
import { Request } from "./types";
import apps from "./routes/apps";
import snippets from "./routes/snippets";
import rateLimit from "./rate-limit";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(
  rateLimit(
    "global",
    1000, // 1 second
    Number(process.env.RATE_LIMIT_PER_SECOND)
  )
);
if (process.env.NODE_ENV !== "development") {
  app.use(auth());
}
app.use((req: Request, res, next) => {
  req.prisma = prisma;
  next();
});
app.use(express.json());

app.use("/apps", apps);
app.use("/snippets", snippets);

app.get("/", (req: Request, res) => {
  res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

if (!process.env.JEST_WORKER_ID) {
  app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
  });
}

export default app;
