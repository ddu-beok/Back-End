const mysql = require("mysql2");
require("dotenv").config();

// 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4", // ✅ 한글/이모지 포함 안전하게 저장
  waitForConnections: true,
  connectionLimit: 10, // 최대 연결 수
  queueLimit: 0,       // 대기열 제한 없음
  multipleStatements: true
});

// DB 초기화 함수 (schema.sql 실행용)
const fs = require("fs");
const path = require("path");
const sqlPath = path.join(__dirname, "schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

function initDB() {
  pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log("DB 연결 성공 (Pool)");

    connection.query(sql, (err) => {
      if (err) throw err;
      console.log("DB 초기화 완료");
      connection.release(); // 풀에 연결 반환
    });
  });
}

module.exports = { pool, initDB };
