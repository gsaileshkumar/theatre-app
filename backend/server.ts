import express from "express";
import cors from "cors";
import shows from "./routes/shows";
import movies from "./routes/movies";
import showstatus from "./routes/showstatus";
import halls from "./routes/halls";
import auth from "./routes/auth";
import session from "express-session";
import { isValidUserMiddleware } from "./middleware/authorization";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:4200"
  })
);
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(session({ secret: "ohmysecret" }));

app.use("/auth", auth);

app.use(isValidUserMiddleware);

app.use("/shows", shows);
app.use("/movies", movies);
app.use("/showstatus", showstatus);
app.use("/halls", halls);

app.use(function(req, res) {
  return res.status(404).send({
    status: "Route unavailable"
  });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
