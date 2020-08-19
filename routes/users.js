const express = require("express");
const auth = require("../middleware/auth");
const {
  createUser,
  loginUser,
  logoutUser,
  logoutAll,
  deleteUser,
} = require("../controllers/users");

const router = express.Router();

router.route("/").post(createUser).delete(auth, deleteUser);
router.route("/login").post(loginUser);
router.route("/logout").delete(auth, logoutUser);
router.route("/logoutAll").delete(auth, logoutAll);
module.exports = router;
