const connection = require("../db/mysql_connection");

// @desc   영화데이터 모두 불러오는 api (25개씩)
// @route  GET  /api/v1/movies (경로 path만 써야함) 물음표 뒤에붙으면 req.query 바디에 붙으면 안됨
// @req     offset, limit (?offset=30&limit=25)
// @res     success, items[ {id,title,attendance,year}, cnt ]
exports.getMovies = async (req, res, next) => {
  console.log("영화 전부 가져오는 API");

  let offset = req.query.offset;
  let limit = req.query.limit;
  // 쿼리빠졌다 알려주는 코드
  if (!offset || !limit) {
    res.status(400).json({ message: "parameters setting error" });
    return;
  }
  // ${offset}, ${limit} 대신 물음표로 해도됨
  let query = `select m.*, count(r.movie_id) as reply_cnt, round(avg(r.rating), 1) as avg_rating  
    from mytable as m
    left join movies_reply as r
    on m.id = r.movie_id
    group by m.id
    order by m.id 
    limit ${offset}, ${limit};`;
  try {
    [rows] = await connection.query(query);
    let cnt = rows.length;
    res.status(200).json({ success: true, items: rows, cnt: cnt });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

// @desc   로그인한 유저의 영화데이터 모두 불러오는 API(25개씩) 인증 된 api 가져오기
// @route  GET  /api/v1/movies/auth
// @req     offset, limit (?offset=30&limit=25)
// @res     success, items[ {id,title,attendance,year, is_favorite}, cnt ]
exports.getAuthMovies = async (req, res, next) => {
  console.log("영화 전부 가져오는 API");

  let offset = req.query.offset;
  let limit = req.query.limit;
  let user_id = req.user.id;

  // 쿼리빠졌다 알려주는 코드
  if (!offset || !limit) {
    res.status(400).json({ message: "parameters setting error" });
    return;
  }
  // ${offset}, ${limit} 대신 물음표로 해도됨
  let query = `select if(f.user_id is null, 0, 1) as is_favorite, m.*, 
      count(r.movie_id) as reply_cnt, round(avg(r.rating), 1) as avg_rating  
      from mytable as m
      left join movies_reply as r
      on m.id = r.movie_id
      left join movies_favorite as f
      on m.id = f.movie_id and f.user_id = ${user_id}
      group by m.id
      order by m.id
      limit ${offset}, ${limit};`;

  try {
    [rows] = await connection.query(query);
    let cnt = rows.length;
    res.status(200).json({ success: true, items: rows, cnt: cnt });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};
