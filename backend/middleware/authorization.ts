import { RES_UNAUTHORIZED } from "../model/response";

export const isValidUserMiddleware = (req, res, next) => {
  const { user } = req.session;
  if (!user || !user.id) {
    return res.status(401).send(RES_UNAUTHORIZED);
  }
  return next();
};

export const isAdminMiddleware = (req, res, next) => {
  const { user } = req.session;
  if (!user!.role.includes("ADMIN")) {
    return res.status(401).send(RES_UNAUTHORIZED);
  }
  return next();
};
