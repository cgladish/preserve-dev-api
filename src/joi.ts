import Joi from "joi";

export const JoiString = Joi.string().min(1).empty("");
export const JoiExternalId = JoiString.max(20).required();
