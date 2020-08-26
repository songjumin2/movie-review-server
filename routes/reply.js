const express = require("express");
const auth = require("../middleware/auth");
const {
  addReply,
  getReply,
  updateReply,
  deleteReply,
} = require("../controllers/reply");

const router = express.Router();

router
  .route("/")
  .post(auth, addReply)
  .get(getReply)
  .put(auth, updateReply)
  .delete(auth, deleteReply);

module.exports = router;
