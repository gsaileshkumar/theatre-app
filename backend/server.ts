import express from "express";
import cors from "cors";
import shows from "./shows";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.use("/shows", shows);

app.listen(port, () => console.log(`App listening on port ${port}!`));
