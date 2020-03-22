import { RES_UNAUTHORIZED } from "../model/response";

export const loginMiddleware = (req, res, next) => {
  const { user } = req.session;
  if (!user || !user.id) {
    return res.status(401).send(RES_UNAUTHORIZED);
  }
  return next();
};
