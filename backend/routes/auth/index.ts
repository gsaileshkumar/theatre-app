import express from "express";
import bcrypt from "bcrypt";
import { GET_USER_BY_EMAIL, CREATE_USER } from "./queries";
import { select, insert } from "../../db";
import { RES_FAILURE, RES_SUCCESS } from "../../model/response";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
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
      name,
      email,
      password: hashedPass,
      role: "USER",
      created_at: new Date()
    };
    const queryOptions = {
      text: CREATE_USER,
      values: Object.values(params)
    };
    const { rowCount } = await insert(queryOptions, null);
    if (rowCount === 1) {
      return res.status(200).send(RES_SUCCESS);
    }
    return res.status(200).send(RES_FAILURE);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows, rowCount: userExists } = await select(GET_USER_BY_EMAIL, [
      email
    ]);
    if (userExists) {
      const { id, password: hashedPassword } = rows[0] as any;
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) {
        const user = {
          id
        };
        req.session!.user = user;
        return res.status(200).send({ ...RES_SUCCESS, ...user });
      }
      return res.status(200).send(RES_FAILURE);
    }
    return res.status(200).send(RES_FAILURE);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

router.post("/logout", async (req, res) => {
  try {
    req.session!.user = null;
    res.clearCookie("connect.sid");
    return res.status(200).send({ ...RES_SUCCESS, message: "Logged out" });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

export default router;
