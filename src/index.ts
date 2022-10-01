import express, { Express } from "express";
import dotenv from "dotenv";
import prisma from "./prisma";
import { Request } from "./types";
import apps from "./routes/apps";
import snippets from "./routes/snippets";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use((req: Request, res, next) => {
  req.prisma = prisma;
  next();
});
app.use(express.json());

app.use("/apps", apps);
app.use("/snippets", snippets);
app.get("/", (req: Request, res) => {
  res.sendStatus(200);
});

if (!process.env.JEST_WORKER_ID) {
  app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
  });
}

export default app;
