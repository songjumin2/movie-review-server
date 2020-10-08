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
// @desc 패스워드 변경
// @route POST /api/v1/users/change
// @parameters email, passwd, new_passwd
exports.changePasswd = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;
  let new_passwd = req.body.new_passwd;

  let query = "select passwd from movie_review_user where email = ?";
  let data = [email];

  try {
    [rows] = await connection.query(query, data);
    let savedPasswd = rows[0].passwd;

    let isMatch = bcrypt.compareSync(passwd, savedPasswd);

    if (isMatch != true) {
      res.status(401).json({ success: false, result: isMatch });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
  query = "update movie_review_user set passwd = ? where email = ?";
  const hashedPasswd = await bcrypt.hash(new_passwd, 8);
  data = [hashedPasswd, email];

  try {
    [result] = await connection.query(query, data);
    if (result.affectedRows == 1) {
      res.status(200).json({ success: true });
      return;
    } else {
      res.status(200).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

// 유저가 패스워드를 분실
// 1. 클라이언트가 패스워드 분실했다고 서버한테 요청
//    서버가 패스워들 변경할 수 있는 url을 클라이언트한테 보내준다
//    (경로에 암호화된 문자열을 보내준다 -> 토큰역할)

// @desc   패스워드 분실
// @route  POST  /api/v1/users/forgotpasswd
// 따로 파라미터 안보내도되고 모스통해서 온다
exports.forgotPasswd = async (req, res, next) => {
  let user = req.user;
  // 암호화된 문자열 만드는 방법
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswdToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // 해당 리셋 패스워드 토큰 데이터베이스에 저장
  // 유저 테이블에 reset_passwd_token 컬럼에 저장
  // 문자열 바꿀 경로 , 쿼리에 들어갈 데이터 설정도해준다
  let query =
    "update movie_review_user set reset_passwd_token = ? where id = ?";
  let data = [resetPasswdToken, user.id];

  try {
    [result] = await connection.query(query, data);
    user.reset_passwd_token = resetPasswdToken;
    res.status(200).json({ success: true, data: user });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

// 2. 클라이언트는 해당 암호화된 주소를 받아서 새로운 비밀번호를 함께 서버로 보낸다
//    서버는 이 주소가 진짜 유효한지 확인해서 새로운 비밀번호로 셋팅

// @desc 리셋 패스워드 토큰을 경로로 만들어서 바꿀 비번과 함께 요청
//       비번 초기화 ( reset passwd api)
// @route POST  /api/v1/users/resetPasswd/:resetPasswdToken(:resetPasswdToken =>/req.params.resetPasswdToken 이 내용임)
// @req   passwd
exports.resetPasswd = async (req, res, next) => {
  const resetPasswdToken = req.params.resetPasswdToken;
  const user_id = req.user.id;

  let query = "select * from movie_review_user where id = ?";
  let data = [user_id];

  try {
    [rows] = await connection.query(query, data);
    savedResetPasswdToken = rows[0].reset_passwd_token;
    if (savedResetPasswdToken !== resetPasswdToken) {
      res.status(400).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }

  let passwd = req.body.passwd;
  // 유저한테 넘어온 패스워드를 암호화 시킨다
  const hashedPasswd = await bcrypt.hash(passwd, 8);
  // 기존에 있던 패스워드를 새로운 패스워드로 업데이트 시킨다
  // reset_passwd_token 패스워드 다 바꾸고 비어있는 패스워드로 다시 바꿔라 '' 공백으로 표시해준다
  query =
    "update movie_review_user set passwd = ?, reset_passwd_token = '' where id = ?";
  data = [hashedPasswd, user_id];
  // 유저의 reset_passwd_token 지워라
  delete req.user.reset_passwd_token;
  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, data: req.user });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
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

// @desc   비번 초기화
// @route  PUT /api/v1/users/passwd   // post도 body로 받는다
// @request email, passwdHint
// @response success, passwd

exports.passwdInit = async (req, res, next) => {
  let email = req.body.email;
  let passwdHint = req.body.passwdHint;

  let query = "select passwd_hint from user where email = ?";
  let data = [email];

  try {
    [rows] = await connection.query(query, data);
    if (rows[0].passwd_hint != passwdHint) {
      res.status(401).json();
      return;
    }
  } catch (e) {
    res.status(500).json();
    return;
  }
  // 랜덤 문자열 5자리로 생성
  let newPasswd = Math.random().toString(36).substr(2, 5);

  // 암호화한다
  const hashedPasswd = await bcrypt.hash(newPasswd, 8);

  query = "update user set passwd = ? where email = ?";
  data = [hashedPasswd, email];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, passwd: newPasswd });
    return;
  } catch (e) {
    res.status(500).json();
    return;
  }
};
