import express from "express";
import cors from "cors";
import shows from "./shows";
import movies from "./movies";
import showstatus from "./showstatus";
import halls from "./halls";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use("/shows", shows);
app.use("/movies", movies);
app.use("/showstatus", showstatus);
app.use("/halls", halls);

app.listen(port, () => console.log(`App listening on port ${port}!`));
