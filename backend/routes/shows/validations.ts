import Joi from "@hapi/joi";

export const showSchema = Joi.object({
  movie_id: Joi.number().required(),
  hall_id: Joi.number().required(),
  show_time: Joi.string()
    .pattern(
      /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/
    )
    .required(),
});
