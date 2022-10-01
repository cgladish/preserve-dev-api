import express, { Express } from "express";
import dotenv from "dotenv";
import snippets from "./routes/snippets";
import prisma from "./prisma";
import { Request } from "./types";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use((req: Request, res, next) => {
  req.prisma = prisma;
  next();
});
app.use(express.json());

app.use("/snippets", snippets);

if (!process.env.JEST_WORKER_ID) {
  app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`);
  });
}

export default app;
