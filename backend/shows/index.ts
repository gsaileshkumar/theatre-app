import express from "express";
import { query } from "../db";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    //   const { id } = req.params;
    const { rows } = await query("SELECT * FROM shows", null);
    res.send(rows);
  } catch (e) {
    console.log("error", e);
  }
});

export default router;
