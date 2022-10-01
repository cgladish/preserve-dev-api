import express from "express";
import { Request } from "../../types";

const router = express.Router();

router.get("/", async (req: Request, res) => {
  const snippets = req.prisma.snippet.findMany();
  res.send(snippets);
});

export default router;
