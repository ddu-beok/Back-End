const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// DB 연결
const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

// schema.sql 읽기
const sqlPath = path.join(__dirname, "schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

// DB 초기화 함수
function initDB() {
  con.connect(err => {
    if (err) throw err;
    console.log("DB 연결 성공");

    con.query(sql, err => {
      if (err) throw err;
      console.log("DB 초기화 완료");
      // con.end();  // 서버 시작 후 계속 연결 유지하려면 주석
    });
  });
}

// 다른 파일에서 import 가능하도록 export
module.exports = { con, initDB };
