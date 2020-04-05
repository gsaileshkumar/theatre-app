import express from "express";
import { CREATE_HALL, GET_ALL_HALLS } from "./queries";
import { select, insert } from "../../db";
import { RES_SUCCESS, RES_FAILURE } from "../../model/response";
import { isAdminMiddleware } from "../../middleware/authorization";

const router = express.Router();

router.post("/", isAdminMiddleware, async (req, res) => {
  try {
    const { name, total_columns, total_rows } = req.body;
    const params = {
      name,
      total_columns: parseInt(total_columns),
      total_rows: parseInt(total_rows),
      created_by: req.session!.user.user_id,
      updated_by: req.session!.user.user_id,
    };
    const queryOptions = {
      text: CREATE_HALL,
      values: Object.values(params),
    };
    const { rowCount } = await insert(queryOptions, null);
    if (rowCount === 1) {
      res.status(200).send(RES_SUCCESS);
    }
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

router.get("/", async (req, res) => {
  try {
    const { rows } = await select(GET_ALL_HALLS, null);
    const response = {
      halls: rows,
    };
    res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

export default router;
