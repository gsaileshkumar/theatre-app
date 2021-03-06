import express from "express";
import { CREATE_HALL, GET_ALL_HALLS, UPDATE_HALL_BY_ID } from "./queries";
import { select, insert } from "../../db";
import {
  RES_SUCCESS,
  RES_FAILURE,
  RES_ERROR,
  RES_VALIDATION_FAILURE,
} from "../../model/response";
import { isAdminMiddleware } from "../../middleware/authorization";
import { hallSchema } from "./validations";

const router = express.Router();

router.post("/", isAdminMiddleware, async (req, res) => {
  try {
    const { name, total_columns, total_rows } = req.body;
    try {
      await hallSchema.validateAsync({
        name,
        total_columns,
        total_rows,
      });
    } catch (err) {
      return res.status(200).send(RES_VALIDATION_FAILURE);
    }
    const params = {
      name,
      total_columns: parseInt(total_columns),
      total_rows: parseInt(total_rows),
      created_by: req.session!.user.id,
      updated_by: req.session!.user.id,
    };
    const queryOptions = {
      text: CREATE_HALL,
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

router.put("/", isAdminMiddleware, async (req, res) => {
  try {
    const { name, total_columns, total_rows, id } = req.body;
    try {
      await hallSchema.validateAsync({
        name,
        total_columns,
        total_rows,
        id,
      });
    } catch (err) {
      return res.status(200).send(RES_VALIDATION_FAILURE);
    }
    const params = {
      name,
      total_columns: parseInt(total_columns),
      total_rows: parseInt(total_rows),
      updated_by: req.session!.user.id,
      hall_id: id,
    };
    const queryOptions = {
      text: UPDATE_HALL_BY_ID,
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

router.get("/", async (req, res) => {
  try {
    const { rows } = await select(GET_ALL_HALLS, null);
    const response = {
      halls: rows,
    };
    return res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

export default router;
