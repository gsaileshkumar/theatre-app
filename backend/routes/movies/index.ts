import express from "express";
import { select, insert } from "../../db";
import { GET_MOVIE_SHOWTIMES, GET_ALL_MOVIES, CREATE_MOVIE } from "./queries";
import { RES_FAILURE, RES_SUCCESS } from "../../model/response";
import { isAdminMiddleware } from "../../middleware/authorization";

const router = express.Router();

router.get("/showtime", async (req, res) => {
  try {
    const { id } = req.query;
    const { rows } = await select(GET_MOVIE_SHOWTIMES, [id]);
    const response = {
      movies: rows
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
      movies: rows
    };
    res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

router.post("/", isAdminMiddleware, async (req, res) => {
  try {
    const { name, ticket_price } = req.body;
    const params = {
      name,
      ticket_price: parseInt(ticket_price)
    };
    const queryOptions = {
      text: CREATE_MOVIE,
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
