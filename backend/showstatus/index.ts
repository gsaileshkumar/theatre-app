import express from "express";
import { query } from "../db";
import { GET_SHOW_AVAILABILITY, GET_HALL_DETAILS_BY_SHOW_ID } from "./queries";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: availability } = await query(GET_SHOW_AVAILABILITY, [id]);
    const { rows: hallDetails } = await query(GET_HALL_DETAILS_BY_SHOW_ID, [
      id
    ]);
    const response = {
      hallDetail: hallDetails[0],
      availability
    };
    res.send(response);
  } catch (e) {
    console.log("error", e);
  }
});

export default router;
