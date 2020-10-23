const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const connection = require("../db/mysql_connection");

// @desc   회원가입
// @route  POST /api/v1/users   // post는 body로 받는다
// @parameters email, passwd
exports.createUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  if (!email || !passwd) {
    res
      .status(400)
      .json({ success: false, message: "이메일, 비밀번호 둘 다 입력해주세요" });
    return;
  }
  if (!validator.isEmail(email)) {
    res
      .status(400)
      .json({ success: false, message: "이메일 형식으로 입력해주세요" });
    return;
  }

  const hashedPasswd = await bcrypt.hash(passwd, 8);

  let query = "insert into movie_review_user(email, passwd) values(?, ?)";
  let data = [email, hashedPasswd];
  let user_id;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    [result] = await conn.query(query, data);
    user_id = result.insertId;
  } catch (e) {
    if (e.errno == 1062) {
      // 이메일 중복된 것이다
      res.status(400).json({ success: false, message: "이메일 중복" });
      return;
    }
    await conn.rollback();
    res.status(500).json();
    return;
  }

  let token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  query = "insert into movie_review_token (user_id, token) values(?, ?)";
  data = [user_id, token];

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

// @desc   로그인
// @route  POST /api/v1/users/login
// @parameters {"email":"thdwnals12@naver.com", "passwd":"1234"}
exports.loginUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  let query = "select * from movie_review_user where email = ? ";
  let data = [email];

  let user_id;
  try {
    [rows] = await connection.query(query, data);
    let hashedPasswd = rows[0].passwd;
    user_id = rows[0].id;
    let isMatch = await bcrypt.compare(passwd, hashedPasswd);

    if (isMatch == false) {
      res.status(401).json({ success: false, result: isMatch });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
  const token = jwt.sign({ user_id: user_id }, process.env.ACCESS_TOKEN_SECRET);
  query = "insert into movie_review_token (token, user_id) values (?, ?)";
  data = [token, user_id];
  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, token: token });
    return;
  } catch (e) {
    res.status(500).json({ error: e });
    return;
  }
};

// @desc   로그아웃 api : db에서 해당 유저의 토큰값을 삭제 (현재의 기기 1개에 대한 로그아웃)
// @route  DELETE /api/v1/users/logout
// @parameters  없음
exports.logoutUser = async (req, res, next) => {
  let user_id = req.user.id;
  let token = req.user.token;

  let query = "delete from movie_review_token where user_id = ? and token = ? ";
  let data = [user_id, token];
  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

// @desc 전체 기기에서 모두 로그아웃 하기
// @route  delete  /api/v1/users/logoutAll
exports.logoutAll = async (req, res, next) => {
  let user_id = req.user.id;

  let query = `delete from movie_review_token where user_id = ${user_id}`;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, result: result });
    return;
  } catch (e) {
    res.status(200).json({ success: false, error: e });
    return;
  }
};

// 유저의 id 값으로 내 정보 가져오기
// @desc 내 정보 가져오기
// @route GET /api/v1/users
exports.getMyInfo = async (req, res, next) => {
  console.log("내 정보 가져오는 API", req.user);

  res.status(200).json({ success: true, result: req.user });
  return;
};

// @desc 회원탈퇴 : 유저 테이블에서 삭제, 토큰 데이블에서 삭제
// @route DELETE  /api/v1/users
exports.deleteUser = async (req, res, next) => {
  let user_id = req.user.id;

  let query = `delete from movie_review_user where id = ${user_id}`;
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();
    [result] = await conn.query(query);
    query = `delete from movie_review_token where user_id = ${user_id}`;
    [result] = await conn.query(query);

    await conn.commit();
    res.status(200).json({ success: true });
    return;
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, error: e });
    return;
  } finally {
    conn.release();
  }
};
