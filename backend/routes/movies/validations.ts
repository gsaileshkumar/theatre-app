import Joi from "@hapi/joi";

export const movieSchema = Joi.object({
  name: Joi.string().required(),
  ticket_price: Joi.number().required(),
});
