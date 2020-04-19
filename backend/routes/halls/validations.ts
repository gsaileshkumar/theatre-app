import Joi from "@hapi/joi";

export const hallSchema = Joi.object({
  id: Joi.number(),
  name: Joi.string().required(),
  total_columns: Joi.number().required(),
  total_rows: Joi.number().required(),
});
