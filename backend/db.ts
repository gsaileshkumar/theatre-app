import { Pool } from "pg";

const pool = new Pool();

const query = (text, params) => {
  return pool.query(text, params);
};

export { query };
