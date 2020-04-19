import Joi from "@hapi/joi";

export const movieSchema = Joi.object({
  id: Joi.number(),
  name: Joi.string().required(),
  ticket_price: Joi.number().required(),
});
