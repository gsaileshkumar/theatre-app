import express from "express";
import { select, insert } from "../../db";
import { GET_MOVIE_SHOWTIMES, GET_ALL_MOVIES, CREATE_MOVIE } from "./queries";
import { RES_FAILURE, RES_SUCCESS, RES_ERROR } from "../../model/response";
import { isAdminMiddleware } from "../../middleware/authorization";

const router = express.Router();

router.get("/showtime", async (req, res) => {
  try {
    const { id, date } = req.query;
    const startOfDayTimestamp = new Date(date).setHours(0, 0, 0, 0);
    const startOfDay = new Date(startOfDayTimestamp);

    const { rows } = await select(GET_MOVIE_SHOWTIMES, [id, startOfDay]);

    const groupByHallnameObject = rows.reduce((groupByHall, obj) => {
      const value = obj["hall_name"];
      groupByHall[value] = (groupByHall[value] || []).concat(obj);
      return groupByHall;
    }, {});

    const groupByHallname = Object.entries(groupByHallnameObject).map(
      (entry) => {
        const obj = {
          hall_name: entry[0],
          availability: entry[1],
        };
        return obj;
      }
    );

    const response = {
      movies: groupByHallname,
    };
    res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE });
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
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.post("/", isAdminMiddleware, async (req, res) => {
  try {
    const { name, ticket_price } = req.body;
    const params = {
      name,
      ticket_price: parseInt(ticket_price),
      created_by: req.session!.user.id,
      updated_by: req.session!.user.id,
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
    return res.status(500).send({ ...RES_FAILURE });
  }
});

export default router;
