const express = require("express");
const auth = require("../middleware/auth");

const {
  addFavorite,
  getMyFavorites,
  deleteFavorite,
} = require("../controllers/favorites");

const router = express.Router();

router.route("/").post(auth, addFavorite).get(auth, getMyFavorites);
router.route("/delete").delete(auth, deleteFavorite);
module.exports = router;
