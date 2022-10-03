import express, { Express } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { expressjwt } from "express-jwt";
import prisma from "./prisma";
import { Request } from "./types";
import apps from "./routes/apps";
import snippets from "./routes/snippets";
import rateLimit from "./middleware/rate-limit";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

if (process.env.NUMBER_OF_PROXIES) {
  app.set("trust proxy", Number(process.env.NUMBER_OF_PROXIES));
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
app.use((req: Request, res, next) => {
  req.prisma = prisma;
  next();
});
app.use(
  expressjwt({
    secret: process.env.JWT_SECRET as string,
    algorithms: ["HS512"],
    credentialsRequired: false,
  })
);
app.use(express.json());

app.use("/apps", apps);
app.use("/snippets", snippets);
app.get("/ping", (req: Request, res) => {
  res.send(req.ip);
});

if (!process.env.JEST_WORKER_ID) {
  app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
  });
}

export default app;
