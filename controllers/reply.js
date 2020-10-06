const connection = require("../db/mysql_connection");

// @desc   댓글 추가
// @route  POST  /api/v1/reply
// @request movie_id, content, rating

exports.addReply = async (req, res, next) => {
  let movie_id = req.body.movie_id;
  let user_id = req.user.id;
  let content = req.body.content;
  let rating = req.body.rating;

  let query =
    "insert into movies_reply \
      (movie_id, user_id, content, rating) values (?,?,?,?)";
  let data = [movie_id, user_id, content, rating];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json();
  }
};
// 내가 쓴 리뷰 가져오기
// @desc 나의 리뷰 가져오기
// @route GET /api/v1/reply/review?offset=0&limit=25&order=desc
// @parameters  offset, limit
// @response success, cnt, items : [{title, content, rating}]
exports.getMyReview = async (req, res, next) => {
  let offset = Number(req.query.offset);
  let limit = Number(req.query.limit);
  let order = req.query.order;
  let user_id = req.user.id;

  if (!order) {
    order = "dasc";
  }

  let query = `select m.id, m.title, m.release_date, mr.id as review_id, mr.content, mr.rating, mr.created_at
  from movies_reply as mr
  join mytable as m
  on mr.movie_id = m.id
  where mr.user_id = ${user_id} 
  order by mr.created_at ${order}
  limit ${offset}, ${limit}`;

  let data = [user_id, order, offset, limit];
  try {
    [rows] = await connection.query(query, data);
    let cnt = rows.length;
    res.status(200).json({ success: true, items: rows, cnt: cnt });
  } catch (e) {
    res.status(400).json({ error: e });
  }
};

// @desc     해당 영화의 댓글을 가져오는 API
// @route    GET  /api/v1/reply?movie_id=124&offset=0&limit=25&order=desc
// @request  movie_id, offset, limit
// @response  sucess, items:[], cnt
// 물음표 뒤에있는건 쿼리에서 찾아야함
exports.getReply = async (req, res, next) => {
  let movie_id = req.query.movie_id;
  let offset = req.query.offset;
  let limit = req.query.limit;
  let order = req.query.order;

  if (!order) {
    order = "dasc";
  }

  let query = `select r.id as reply_id, m.title, u.id as user_id, u.email, r.content,
  r.rating, r.created_at 
  from movies_reply as r 
  join mytable as m on r.movie_id = m.id 
  join movie_review_user as u  on r.user_id = u.id 
  where r.movie_id = ${movie_id} order by r.created_at ${order} limit ${offset}, ${limit} `;
  // offset, limit 는 넘버 붙여줘야함
  let data = [movie_id, order, Number(offset), Number(limit)];
  try {
    [rows] = await connection.query(query, data);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

// @desc    내가 쓴 댓글 수정
// @route   PUT /api/v1/reply
// @request reply_id, content, rating
exports.updateReply = async (req, res, next) => {
  // 이 사람이 쓴 댓글이 맞는지 체크 => 맞으면 댓글 수정

  let reply_id = req.body.reply_id;
  let user_id = req.user.id;
  let content = req.body.content;
  let rating = req.body.rating;

  let query = "select * from movies_reply where id =? ";
  let data = [reply_id];

  try {
    [rows] = await connection.query(query, data);
    // 댓글 쓴 사람이 아니면, 401로 보낸다 (너는 이 댓글 수정할 수 없다)
    if (rows[0].user_id != user_id) {
      res.status(401).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(400).json({ success: false });
    return;
  }

  query = "update movies_reply set content = ?, rating = ? where id = ? ";
  data = [content, rating, reply_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
    return;
  } catch (e) {
    res.status(400).json({ success: false });
    return;
  }
};
// @desc   자신이 적은 댓글 삭제하기
// @route  DELETE /api/v1/reply
// @request reply_id, user_id

exports.deleteReply = async (req, res, next) => {
  let reply_id = req.body.reply_id;
  let user_id = req.user.id;

  // 해당 유저의 댓글이 맞는지 체크
  let query = "select * from movies_reply where id = ?";
  let data = [reply_id];

  try {
    [rows] = await connection.query(query, data);
    if (rows[0].user_id != user_id) {
      res.status(401).json({ success: false });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }
  // 여기까지 통과한거면 맞는 유저니까 댓글 삭제한다
  query = "delete from movies_reply where id = ?";
  data = [reply_id];

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true });
    return;
  } catch (e) {
    res.status(500).json({ success: false });
    return;
  }
};
