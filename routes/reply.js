const express = require("express");
const auth = require("../middleware/auth");
const {
  addReply,
  getReply,
  updateReply,
  deleteReply,
  getMyReview,
  getMyReply
} = require("../controllers/reply");

const router = express.Router();

router
  .route("/")
  .post(auth, addReply)
  .get(getReply)
  .put(auth, updateReply)
router.route("/delete").post(auth, deleteReply);
router.route("/review").get(auth, getMyReview);
router.route("/myreview").get(auth, getMyReply)

module.exports = router;
