const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const connection = require("../db/mysql_connection");

// @desc   회원가입
// @route  POST /api/v1/users   // post는 body로 받는다
// @parameters email, passwd
exports.createUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  if (!validator.isEmail(email)) {
    res.status(400).json({ success: false });
    return;
  }

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  let query = "insert into movie_review_user(email, passwd) values(?,?)";
  let data = [email, hashedPasswd];
  let user_id;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    [result] = await conn.query(query, data);
    user_id = result.insertId;
  } catch (e) {
    await conn.rollback();
    res.status(500).json();
    return;
  }

  let token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  query = "insert into movie_review_token (user_id, token) values(?,?)";
  data = [token, user_id];

  try {
    [result] = await conn.query(query, data);
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, error: e });
    return;
  }
  await conn.commit();
  await conn.release();

  res.status(200).json({ success: true, token: token });
};
