import express from "express";
import * as Joi from "joi";
import { ValidatedRequest, createValidator } from "express-joi-validation";
import { Request } from "../../types";

const router = express.Router();
const validator = createValidator();

router.get("/:id", async (req: Request, res) => {
  const externalId = req.params.id;
  const snippet = await req.prisma.snippet.findFirst({
    where: { id: req.prisma.snippet.externalIdToId(externalId) },
  });
  res.send(snippet);
});

type CreateSnippetInput = {
  public: boolean;
  title?: string;
  appSpecificData?: object;
  messages: {
    content: string;
    sentAt: Date;
    appSpecificData?: object;
    authorUsername: string;
    authorIdentifier?: string;
    authorAvatarUrl?: string;
  }[];
};
const createSnippetSchema = Joi.object<CreateSnippetInput>({
  public: Joi.boolean().required(),
  title: Joi.string().empty(""),
  appSpecificData: Joi.object(),
  messages: Joi.array()
    .min(1)
    .required()
    .items(
      Joi.object({
        content: Joi.string().required(),
        sentAt: Joi.date().required(),
        appSpecificDataJson: Joi.object(),
        authorUsername: Joi.string().required(),
        authorIdentifier: Joi.string(),
        authorAvatarUrl: Joi.string(),
      })
    ),
});
router.post(
  "/",
  validator.body(createSnippetSchema),
  async (req: Request<{}, {}, CreateSnippetInput>, res) => {
    console.log(req.body);
    res.sendStatus(201);
  }
);

export default router;
