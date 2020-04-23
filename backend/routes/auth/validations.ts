import Joi from "@hapi/joi";

const usernameSchema = Joi.string().alphanum().min(3).max(50).required();

const passwordSchema = Joi.string()
  .pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,30}$/
  )
  .required();

export const signupSchema = Joi.object({
  username: usernameSchema,
  fullname: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: passwordSchema,
  mobile: Joi.string()
    .pattern(/^[789]\d{9}$/)
    .required(),
  captcha: Joi.string().required(),
});

export const loginSchema = Joi.object({
  username: usernameSchema,
  password: passwordSchema,
});
