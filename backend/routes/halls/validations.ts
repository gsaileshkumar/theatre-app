import Joi from "@hapi/joi";

export const hallSchema = Joi.object({
  name: Joi.string().required(),
  total_columns: Joi.number(),
  total_rows: Joi.number(),
});
