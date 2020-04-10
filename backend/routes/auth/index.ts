import express from "express";
import bcrypt from "bcrypt";
import {
  GET_USER_BY_EMAIL,
  CREATE_USER,
  GET_USER_BY_USERNAME,
} from "./queries";
import { select, insert } from "../../db";
import { RES_FAILURE, RES_SUCCESS } from "../../model/response";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, fullname, email, password, mobile } = req.body;
    if (!username || !fullname || !email || !password || !mobile) {
      return res.status(200).send(RES_FAILURE);
    }
    const { rowCount: userExists } = await select(GET_USER_BY_EMAIL, [email]);
    if (userExists) {
      return res
        .status(200)
        .send({ ...RES_SUCCESS, status: "User already exists" });
    }
    const hashedPass = await bcrypt.hash(password, 10);
    const params = {
      username,
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
    const { rows, rowCount: userExists } = await select(GET_USER_BY_USERNAME, [
      username.toUpperCase(),
    ]);
    if (userExists) {
      const {
        user_id,
        user_password: hashedPassword,
        user_role,
      } = rows[0] as any;
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) {
        const user = {
          id: user_id,
          role: user_role,
        };
        req.session!.user = user;
        return res.status(200).send({ ...RES_SUCCESS, ...user });
      }
      return res.status(200).send(RES_FAILURE);
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
