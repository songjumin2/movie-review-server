const express = require("express");
const auth = require("../middleware/auth");
const {
  addReply,
  getReply,
  updateReply,
  deleteReply,
  getMyReview,
  // myGetReply
} = require("../controllers/reply");
const { route } = require("./movies");

const router = express.Router();

router
  .route("/")
  .post(auth, addReply)
  .get(getReply)
  .put(auth, updateReply)
router.route("/delete").post(auth, deleteReply);
router.route("/review").get(auth, getMyReview);
// router.route("/myReview").get(auth, myGetReply);


module.exports = router;
