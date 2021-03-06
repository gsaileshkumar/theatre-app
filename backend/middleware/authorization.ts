import { RES_UNAUTHORIZED } from '../model/response';

export const isValidUserMiddleware = (req, res, next) => {
  const { user } = req.session;
  if (!user || !user.id) {
    return res.status(200).send(RES_UNAUTHORIZED);
  }
  return next();
};

export const isAdminMiddleware = (req, res, next) => {
  const { user } = req.session;
  console.log(user);
  if (!user!.role.includes('ADMIN')) {
    return res.status(200).send(RES_UNAUTHORIZED);
  }
  return next();
};
