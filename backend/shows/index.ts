import express from "express";
import { query } from "../db";
import { LIST_ALL_SHOWS } from "./queries";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { rows } = await query(LIST_ALL_SHOWS, null);
    res.send(rows);
  } catch (e) {
    console.log("error", e);
  }
});

export default router;
