import express from "express";
import { select, insert } from "../../db";
import { GET_ALL_SHOWS, CREATE_SHOW } from "./queries";
import { RES_SUCCESS, RES_FAILURE } from "../../model/response";
import { isAdminMiddleware } from "../../middleware/authorization";

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

router.post("/", isAdminMiddleware, async (req, res) => {
  try {
    const { movie_id, hall_id, show_time } = req.body;
    const params = {
      movie_id: parseInt(movie_id),
      hall_id: parseInt(hall_id),
      show_time
    };
    const queryOptions = {
      text: CREATE_SHOW,
      values: Object.values(params)
    };
    const { rowCount } = await insert(queryOptions, null);
    if (rowCount === 1) {
      res.status(200).send(RES_SUCCESS);
    }
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

export default router;
