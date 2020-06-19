import express from 'express';
import bcrypt from 'bcryptjs';
import svgCaptcha from 'svg-captcha';
import {
  GET_USER_BY_EMAIL,
  CREATE_USER,
  GET_USER_BY_USERNAME,
  GET_USER_BY_USER_ID,
} from './queries';
import { select, insert } from '../../db';
import {
  RES_FAILURE,
  RES_SUCCESS,
  RES_VALIDATION_FAILURE,
  RES_UNAUTHORIZED,
  RES_ERROR,
} from '../../model/response';
import { signupSchema, loginSchema } from './validations';
import { isValidUserMiddleware } from '../../middleware/authorization';
import { COOKIE_EXPIRY_TIME_IN_MS } from '../../config';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, fullname, email, password, mobile, captcha } = req.body;
    if (!username || !fullname || !email || !password || !mobile) {
      return res.status(200).send(RES_FAILURE);
    }
    try {
      await signupSchema.validateAsync({
        username,
        fullname,
        email,
        password,
        mobile,
        captcha,
      });
    } catch (err) {
      return res.status(200).send(RES_VALIDATION_FAILURE);
    }

    const captchaInSession = req.session!.captcha;
    if (captcha !== captchaInSession) {
      return setAndReturnCaptcha(req, res, RES_VALIDATION_FAILURE);
    }

    const { rowCount: userExists } = await select(GET_USER_BY_EMAIL, [email]);
    if (userExists) {
      return setAndReturnCaptcha(req, res, {
        ...RES_ERROR,
        status: 'User already exists',
      });
    }
    const hashedPass = await bcrypt.hash(password, 10);
    const params = {
      username: username.toUpperCase(),
      fullname,
      email,
      password: hashedPass,
      mobile,
      role: 'USER',
    };
    const queryOptions = {
      text: CREATE_USER,
      values: Object.values(params),
    };
    const { rowCount } = await insert(queryOptions, null);
    if (rowCount === 1) {
      req.session!.captcha = null;
      return res.status(200).send(RES_SUCCESS);
    }
    return setAndReturnCaptcha(req, res, RES_ERROR);
  } catch (e) {
    return setAndReturnCaptcha(req, res, RES_FAILURE);
  }
});

const setAndReturnCaptcha = (req, res, jsonResp) => {
  const captcha = svgCaptcha.create();
  req.session!.captcha = captcha.text;
  return res.status(200).send({ ...jsonResp, captcha: captcha.data });
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    try {
      await loginSchema.validateAsync({
        username,
        password,
      });
    } catch (err) {
      return res.status(200).send(RES_VALIDATION_FAILURE);
    }
    const { rows, rowCount: userExists } = await select(GET_USER_BY_USERNAME, [
      username.toUpperCase(),
    ]);
    if (userExists) {
      const {
        user_id,
        user_password: hashedPassword,
        user_role,
        user_full_name,
      } = rows[0] as any;
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) {
        const user = {
          id: user_id,
          role: user_role,
          full_name: user_full_name,
        };
        req.session!.user = user;
        return res.status(200).send({
          ...RES_SUCCESS,
          message: 'Logged in',
          user,
          cookieExpiryTime: COOKIE_EXPIRY_TIME_IN_MS,
        });
      }
      return res.status(200).send(RES_ERROR);
    }
    return res.status(200).send(RES_ERROR);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.get('/ping', isValidUserMiddleware, async (req, res) => {
  try {
    const user_id = req.session!.user.id;
    if (!user_id) {
      return res.status(200).send(RES_UNAUTHORIZED);
    }
    const { rows, rowCount: userExists } = await select(GET_USER_BY_USER_ID, [
      user_id,
    ]);

    if (userExists) {
      const { user_id, user_role, user_full_name } = rows[0] as any;
      const user = {
        id: user_id,
        role: user_role,
        full_name: user_full_name,
      };
      return res.status(200).send({
        ...RES_SUCCESS,
        user,
        cookieExpiryTime: COOKIE_EXPIRY_TIME_IN_MS,
      });
    }
    return res.status(200).send(RES_ERROR);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.post('/logout', async (req, res) => {
  try {
    req.session!.user = null;
    res.clearCookie('connect.sid');
    return res.status(200).send({ ...RES_SUCCESS, message: 'Logged out' });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.get('/captcha', async (req, res) => {
  try {
    const captcha = svgCaptcha.create();
    req.session!.captcha = captcha.text;
    return res.status(200).send({ ...RES_SUCCESS, captcha: captcha.data });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

export default router;
