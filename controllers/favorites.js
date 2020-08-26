const connection = require("../db/mysql_connection");
const express = require("express");

// @desc   좋아하는 영화 추가
// @route  POST /api/v1/favorites  (post는 body에 담겨있다, parameters는 바디에 담아오는건데 user_id는 해더에 담겨서 일단 movie_id만 가져온다 )
// @parameters movie_id  (user_id 해킹대비해서 암호화 되어야함 토큰은 해더에 담아서 온다, user_id는 미들웨어가 해줘야함 auth가 함)

exports.addFavorite = async (req, res, next) => {
  // 즐겨찾기에 이미 추가된 영화는 즐겨찾기에 추가되지 않도록 한다

  let movie_id = req.body.movie_id;
  let user_id = req.user.id;

  let query = "insert into movies_favorite (movie_id, user_id) values (?, ?)";
  let data = [movie_id, user_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
  } catch (e) {
    // 1062 에러코드는 중복 되었다 라는 코드
    if (e.errno == 1062) {
      res.status(500).json({ message: "이미 즐겨찾기에 추가되었습니다." });
    } else {
      res.status(500).json({ error: e });
    }
  }
};

// @desc    즐겨찾기에 저장 된 영화 가져오는 API
// @route   GET  /api/v1/favorites?offset=0&limit=25
// @parameters  offset, limit
// @response success, cnt, itens : [{title, genre, attendance, year}]
exports.getMyFavorites = async (req, res, next) => {
  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);
  let user_id = req.user.id;

  let query =
    "select m.id, m.title, m.release_date, f.id as favorite_id \
      from movies_favorite as f \
      join mytable as m \
      on f.movie_id = m.id \
      where f.user_id = ? \
      limit ?, ?";

  let data = [user_id, offset, limit];

  try {
    [rows] = await connection.query(query, data);
    let cnt = rows.length;
    res.status(200).json({ success: true, items: rows, cnt: cnt });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};
// @desc    즐겨찾기 삭제
// @route   DELETE  /api/v1/favorites/delete
// @request movie_id, user_id(auth)

exports.deleteFavorite = async (req, res, next) => {
  let movie_id = req.body.movie_id;
  let user_id = req.user.id;

  if (!movie_id) {
    res.status(400).json();
    return;
  }

  let query = "delete from movies_favorite where user_id = ? and movie_id = ?";
  let data = [user_id, movie_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json();
  }
};
