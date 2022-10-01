import express from "express";
import { Request } from "../../types";

const router = express.Router();

router.get("/:id", async (req: Request, res) => {
  const externalId = req.params.id;
  const snippet = await req.prisma.snippet.findFirst({
    where: { id: req.prisma.snippet.externalIdToId(externalId) },
  });
  res.send(snippet);
});

export default router;
