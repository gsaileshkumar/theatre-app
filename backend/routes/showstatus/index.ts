import express from "express";
import { select, pool } from "../../db";
import {
  GET_SHOW_AVAILABILITY,
  GET_HALL_DETAILS_BY_SHOW_ID,
  CHECK_IF_ARE_SEATS_TAKEN,
  BOOK_SINGLE_TICKET,
} from "./queries";
import { RES_SUCCESS, RES_FAILURE } from "../../model/response";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: availability } = await select(GET_SHOW_AVAILABILITY, [id]);
    const { rows: hallDetails } = await select(GET_HALL_DETAILS_BY_SHOW_ID, [
      id,
    ]);
    const response = {
      hallDetail: hallDetails[0],
      availability,
    };
    res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    res.status(500).send({ ...RES_FAILURE, error: e });
  }
});

router.post("/booktickets", async (req, res) => {
  try {
    const { sequence_numbers, show_id } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const seqNumArray = sequence_numbers.split(",");
      const checkSeatsParams = {
        show_id,
        sequence_numbers: seqNumArray,
      };
      const checkSeatsQueryOptions = {
        text: CHECK_IF_ARE_SEATS_TAKEN,
        values: Object.values(checkSeatsParams),
      };
      const { rowCount: takenCount } = await client.query(
        checkSeatsQueryOptions
      );
      if (takenCount !== 0) {
        return res
          .status(200)
          .send({ message: "Already booked", ...RES_SUCCESS });
      }
      seqNumArray.forEach(async (sequence_number) => {
        const params = {
          show_id,
          sequence_number,
        };
        const queryOptions = {
          text: BOOK_SINGLE_TICKET,
          values: Object.values(params),
        };
        await client.query(queryOptions);
      });

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }

    return res
      .status(200)
      .send({ ...RES_SUCCESS, message: "Tickets booked", sequence_numbers });
  } catch (e) {
    return res
      .status(500)
      .send({ ...RES_FAILURE, error: "Error while booking tickets" });
  }
});

export default router;
