const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const users = require("./routes/users");
const movies = require("./routes/movies");
const reply = require("./routes/reply");
const favorites = require("./routes/favorites");

const app = express();
app.use(express.json());

app.use("/api/v1/users", users);
app.use("/api/v1/movies", movies);
app.use("/api/v1/reply", reply);
app.use("/api/v1/favorites", favorites);

const PORT = process.env.PORT || 6600;

app.listen(PORT, console.log("서버 실행됨"));
