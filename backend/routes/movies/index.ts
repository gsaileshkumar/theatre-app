import express from "express";
import { select, insert } from "../../db";
import { GET_MOVIE_SHOWTIMES, GET_ALL_MOVIES, CREATE_MOVIE } from "./queries";
import { RES_FAILURE, RES_SUCCESS, RES_ERROR } from "../../model/response";
import { isAdminMiddleware } from "../../middleware/authorization";

const router = express.Router();

router.get("/showtime", async (req, res) => {
  try {
    const { id } = req.query;
    const { rows } = await select(GET_MOVIE_SHOWTIMES, [id]);
    const response = {
      movies: rows,
    };
    res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

router.get("/", async (req, res) => {
  try {
    const { rows } = await select(GET_ALL_MOVIES, null);
    const response = {
      movies: rows,
    };
    return res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

router.post("/", isAdminMiddleware, async (req, res) => {
  try {
    const { name, ticket_price } = req.body;
    const params = {
      name,
      ticket_price: parseInt(ticket_price),
      created_by: req.session!.user.user_id,
      updated_by: req.session!.user.user_id,
    };
    const queryOptions = {
      text: CREATE_MOVIE,
      values: Object.values(params),
    };
    const { rowCount } = await insert(queryOptions, null);
    if (rowCount === 1) {
      return res.status(200).send(RES_SUCCESS);
    }
    return res.status(200).send(RES_ERROR);
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

export default router;
