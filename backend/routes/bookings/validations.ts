import Joi from "@hapi/joi";

export const bookTicketsSchema = Joi.object({
  sequence_numbers: Joi.string().required(),
  show_id: Joi.number().integer().required(),
});
