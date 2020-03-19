import express from "express";
import cors from "cors";
import shows from "./shows";
import movies from "./movies";
import showstatus from "./showstatus";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/shows", shows);
app.use("/movies", movies);
app.use("/showstatus", showstatus);

app.listen(port, () => console.log(`App listening on port ${port}!`));
