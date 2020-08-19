// promise로 개발된, mysql2패키지를 설치하고 로딩
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWD,
  waitForConnections: true,
  connectionLimit: 10,
});

const connection = pool.promise();

module.exports = connection;
