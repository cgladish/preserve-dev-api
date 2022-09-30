import express, { Express } from "express";
import dotenv from "dotenv";
import snippets from "./routes/snippets";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use("/snippets", snippets);

app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});
