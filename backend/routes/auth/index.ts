import express from "express";
import bcrypt from "bcrypt";
import {
  GET_USER_BY_EMAIL,
  CREATE_USER,
  GET_USER_BY_USERNAME,
  GET_USER_BY_USER_ID,
} from "./queries";
import { select, insert } from "../../db";
import {
  RES_FAILURE,
  RES_SUCCESS,
  RES_VALIDATION_FAILURE,
  RES_UNAUTHORIZED,
} from "../../model/response";
import { signupSchema, loginSchema } from "./validations";
import { isValidUserMiddleware } from "../../middleware/authorization";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, fullname, email, password, mobile } = req.body;
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
      });
    } catch (err) {
      return res.status(200).send(RES_VALIDATION_FAILURE);
    }

    const { rowCount: userExists } = await select(GET_USER_BY_EMAIL, [email]);
    if (userExists) {
      return res
        .status(200)
        .send({ ...RES_SUCCESS, status: "User already exists" });
    }
    const hashedPass = await bcrypt.hash(password, 10);
    const params = {
      username: username.toUpperCase(),
      fullname,
      email,
      password: hashedPass,
      mobile,
      role: "USER",
    };
    const queryOptions = {
      text: CREATE_USER,
      values: Object.values(params),
    };
    const { rowCount } = await insert(queryOptions, null);
    if (rowCount === 1) {
      return res.status(200).send(RES_SUCCESS);
    }
    return res.status(200).send(RES_FAILURE);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.post("/login", async (req, res) => {
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
        return res.status(200).send({ ...RES_SUCCESS, message: "Logged in" });
      }
      return res.status(200).send(RES_FAILURE);
    }
    return res.status(200).send(RES_FAILURE);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.get("/ping", isValidUserMiddleware, async (req, res) => {
  try {
    const user_id = req.session!.user.id;
    if (!user_id) {
      return res.status(401).send(RES_UNAUTHORIZED);
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
      return res.status(200).send({ ...RES_SUCCESS, ...user });
    }
    return res.status(200).send(RES_FAILURE);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.post("/logout", async (req, res) => {
  try {
    req.session!.user = null;
    res.clearCookie("connect.sid");
    return res.status(200).send({ ...RES_SUCCESS, message: "Logged out" });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

export default router;
