// src/index.js
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { initDB } = require("./db.config");

const userRoutes = require("./routes/userRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes"); 
const dduBeokRouters = require("./routes/dduBeokRouter.js")

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

// ✅ 기존 유저 API
app.use("/api/users", userRoutes);

// ✅ 일정(Trip/Item) API
app.use("/api/ddu-beoks", scheduleRoutes);

app.use("/api/ddu-beok", dduBeokRouters);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
