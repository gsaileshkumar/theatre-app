import express from "express";
import { query } from "../db";
import { LIST_MOVIE_SHOWTIMES } from "./queries";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(LIST_MOVIE_SHOWTIMES, [id]);
    res.send(rows);
  } catch (e) {
    console.log("error", e);
  }
});

export default router;
