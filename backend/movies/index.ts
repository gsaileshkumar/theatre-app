import express from "express";
import { select } from "../db";
import { GET_MOVIE_SHOWTIMES, GET_ALL_MOVIES } from "./queries";
import { RES_FAILURE, RES_SUCCESS } from "../model/response";

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

export default router;
