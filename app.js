require("dotenv").config();
const express = require("express");
const logger = require("morgan");

const app = express();
const PORT = 3005;

app.use(logger("dev"));

app.use(express.json()); //http://expressjs.com/en/api.html#express.json
app.use(express.urlencoded({ extended: false })); //http://expressjs.com/en/5x/api.html#express.urlencoded

app.get("/", (req, res, next) => {
  res.send("running");
});

app.listen(PORT, () => {
  console.info(`App listening on port ${PORT}`);
});
