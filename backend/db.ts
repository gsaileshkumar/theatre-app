import { Pool } from "pg";

const pool = new Pool();

const select = (text, params) => {
  return pool.query(text, params);
};

const insert = (text, callback) => {
  return pool.query(text, callback);
};

export { select, insert };
