const express = require("express");
const auth = require("../middleware/auth");
const {
  createUser,
  loginUser,
  logoutUser,
  logoutAll,
  deleteUser,
  changePasswd,
  getMyInfo,
  forgotPasswd,
  resetPasswd,
} = require("../controllers/users");

const router = express.Router();

router.route("/").post(createUser).delete(auth, deleteUser).get(getMyInfo);
router.route("/login").post(loginUser);
router.route("/logout").delete(auth, logoutUser);
router.route("/logoutAll").delete(auth, logoutAll);
router.route("/change").post(auth, changePasswd);
router.route("/forgotPasswd").post(auth, forgotPasswd);
router.route("/resetPasswd").post(auth, resetPasswd);

module.exports = router;
