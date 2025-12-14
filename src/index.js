const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { initDB } = require("./db.config");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// DB 생성시 사용
// initDB();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
