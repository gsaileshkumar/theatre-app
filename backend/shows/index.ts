import express from "express";
import { select } from "../db";
import { GET_ALL_SHOWS } from "./queries";
import { RES_SUCCESS, RES_FAILURE } from "../model/response";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await select(GET_ALL_SHOWS, null);
    const response = {
      shows: rows
    };
    res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

export default router;
