import express from "express";
import { select, pool } from "../../db";
import {
  GET_SHOW_AVAILABILITY,
  GET_HALL_DETAILS_BY_SHOW_ID,
  CHECK_IF_ARE_SEATS_TAKEN,
  BOOK_SINGLE_TICKET,
  GET_USER_BOOKINGS,
} from "./queries";
import { RES_SUCCESS, RES_FAILURE, RES_ERROR } from "../../model/response";

const router = express.Router();

router.get("/show", async (req, res) => {
  try {
    const { id } = req.query;
    const { rows: availability } = await select(GET_SHOW_AVAILABILITY, [id]);
    const { rows: hallDetails } = await select(GET_HALL_DETAILS_BY_SHOW_ID, [
      id,
    ]);
    const response = {
      hallDetail: hallDetails[0],
      availability,
    };
    return res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.get("/", async (req, res) => {
  try {
    const user_id = req.session!.user.id;
    const { rows: bookings } = await select(GET_USER_BOOKINGS, [user_id]);

    const response = {
      bookings,
    };
    return res.status(200).send({ ...response, ...RES_SUCCESS });
  } catch (e) {
    return res.status(500).send({ ...RES_FAILURE });
  }
});

router.post("/booktickets", async (req, res) => {
  try {
    const { sequence_numbers, show_id } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const seqNumArray = sequence_numbers.split(",");

      const hallDetailsQueryOptions = {
        text: GET_HALL_DETAILS_BY_SHOW_ID,
        values: [show_id],
      };

      const { rows } = await client.query(hallDetailsQueryOptions);
      const { hall_total_columns, hall_total_rows } = rows[0];

      const validEntries = seqNumArray.filter(
        (seq_num) =>
          seq_num > 0 && seq_num <= hall_total_rows * hall_total_columns
      );

      if (validEntries.length !== seqNumArray.length) {
        return res
          .status(200)
          .send({ message: "Invalid Entries", ...RES_ERROR });
      }

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
          .send({ message: "Already booked", ...RES_ERROR });
      }

      seqNumArray.forEach(async (sequence_number) => {
        const params = {
          user_id: req.session!.user.user_id,
          show_id,
          sequence_number,
          created_by: req.session!.user.user_id,
          updated_by: req.session!.user.user_id,
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

    return res.status(200).send({
      ...RES_SUCCESS,
      message: "Tickets successfully booked",
      sequence_numbers,
    });
  } catch (e) {
    return res
      .status(500)
      .send({ ...RES_FAILURE, error: "Error while booking tickets" });
  }
});

export default router;
