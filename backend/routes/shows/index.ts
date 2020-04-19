import express from "express";
import { select, insert } from "../../db";
import { GET_ALL_SHOWS, CREATE_SHOW, UPDATE_SHOW_BY_ID } from "./queries";
import {
  RES_SUCCESS,
  RES_FAILURE,
  RES_ERROR,
  RES_VALIDATION_FAILURE,
} from "../../model/response";
import { isAdminMiddleware } from "../../middleware/authorization";
import { showSchema } from "./validations";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await select(GET_ALL_SHOWS, null);
    const response = {
      shows: rows,
    };
    return res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.post("/", isAdminMiddleware, async (req, res) => {
  try {
    const { movie_id, hall_id, show_time } = req.body;
    try {
      await showSchema.validateAsync({
        movie_id,
        hall_id,
        show_time,
      });
    } catch (err) {
      return res.status(200).send(RES_VALIDATION_FAILURE);
    }
    const params = {
      movie_id: parseInt(movie_id),
      hall_id: parseInt(hall_id),
      show_time,
      created_by: req.session!.user.id,
      updated_by: req.session!.user.id,
    };
    const queryOptions = {
      text: CREATE_SHOW,
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

router.put("/", isAdminMiddleware, async (req, res) => {
  try {
    const {
      movie_id,
      hall_id,
      show_time,
      show_id,
      show_current_status,
    } = req.body;
    try {
      await showSchema.validateAsync({
        movie_id,
        hall_id,
        show_time,
        show_id,
        show_current_status,
      });
    } catch (err) {
      return res.status(200).send(RES_VALIDATION_FAILURE);
    }
    const params = {
      movie_id: parseInt(movie_id),
      hall_id: parseInt(hall_id),
      show_time,
      updated_by: req.session!.user.id,
      show_current_status,
      show_id,
    };
    const queryOptions = {
      text: UPDATE_SHOW_BY_ID,
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
