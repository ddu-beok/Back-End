const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { initDB } = require("./db.config");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:3000', // 프론트 주소
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
const userRoutes = require("./routes/userRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const dduBeokRouters = require("./routes/dduBeokRouter.js");
const recommendRoutes = require("./routes/recommendRoutes");
const devRoutes = require("./routes/devRoutes");
const todoRouters = require("./routes/todoRouter.js");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/ddu-beoks", scheduleRoutes);
app.use("/api/ddu-beok", dduBeokRouters);
app.use("/api/to-do", todoRouters);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
