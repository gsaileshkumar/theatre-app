import express from "express";
import { select } from "../../db";
import { GET_SHOW_AVAILABILITY, GET_HALL_DETAILS_BY_SHOW_ID } from "./queries";
import { RES_SUCCESS, RES_FAILURE } from "../../model/response";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: availability } = await select(GET_SHOW_AVAILABILITY, [id]);
    const { rows: hallDetails } = await select(GET_HALL_DETAILS_BY_SHOW_ID, [
      id
    ]);
    const response = {
      hallDetail: hallDetails[0],
      availability
    };
    res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

export default router;
