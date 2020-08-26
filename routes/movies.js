const express = require("express");
const auth = require("../middleware/auth");

const { getMovies, getAuthMovies } = require("../controllers/movies");

const router = express.Router();

router.route("/").get(getMovies);
router.route("/auth").get(auth, getAuthMovies);

module.exports = router;
