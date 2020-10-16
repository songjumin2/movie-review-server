const express = require("express");
const auth = require("../middleware/auth");
const {
  addReply,
  getReply,
  updateReply,
  deleteReply,
  getMyReview,
  getMyReview2,
} = require("../controllers/reply");

const router = express.Router();

router
  .route("/")
  .post(auth, addReply)
  .get(getReply)
  .put(auth, updateReply)
router.route("/delete").post(auth, deleteReply);
router.route("/review").get(auth, getMyReview);
router.route("/review2").get(auth, getMyReview2);

module.exports = router;
