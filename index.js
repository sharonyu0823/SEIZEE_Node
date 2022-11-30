require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

// top-level middleware
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // console.log({ origin: origin });
    callback(null, true);
  },
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(async (req, res, next) => {
  // DateTime
  res.locals.toDatetimeString = (d) => moment(d).format("YYYY-MM-DD  HH:mm:ss");

  // JWT auth
  res.locals.auth = {}; // 預設值
  let auth = req.get("Authorization");
  // console.log("req.:", req.path);
  // console.log("beforeauth:", auth);

  if (auth && auth.indexOf("Bearer ") === 0) {
    auth = auth.slice(7);
    try {
      const payload = await jwt.verify(auth, process.env.JWT_SECRET);
      res.locals.auth = payload;
      console.log("payload123:", payload);
    } catch (error) {
      console.log("jwt錯誤");
    }
  }

  // console.log("afterauth:", auth);
  // console.log("process.env.JWT_SECRET:", process.env.JWT_SECRET);
  // console.log("res.locals:", res.locals);
  // console.log("res.locals.auth.mb_sid:", res.locals.auth.mb_sid);
  // console.log("payload:", payload);

  next();
});

// routes
// 01-cart

// 02-forum

// 03-shop

// 04-product

// 05-member
app.use("/user", require(__dirname + "/routes/user"));
app.use("/user-search", require(__dirname + "/routes/user_others"));

// 06-event

// 環境設定
app.use(express.static("public"));

const port = process.env.SERVER_PORT || 3002;
app.listen(port, () => {
  console.log("server started");
});
