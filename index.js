require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

// cart

const bodyParser = require('body-parser');
const https = require('https');

// top-level middleware
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // console.log({ origin: origin });
    callback(null, true);
  },
};

app.set("view engine", "ejs")     

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

// 00-homepage
app.use("/home", require(__dirname + "/routes/homepage"));
// app.use("/api/seizee", require(__dirname + "/routes/home"));

// 01-cart
app.use("/cart", require(__dirname + "/routes/cart"));

// 02-forum
app.use("/forum",require(__dirname + "/routes/forum"));

// 03-shop
app.use("/api/shop", require(__dirname + "/routes/shop"));

// 04-product
app.use("/product", require(__dirname + "/routes/product"));

// 05-member
app.use("/user", require(__dirname + "/routes/user"));
// app.use("/google", require(__dirname + "/routes/google"));
app.use("/user-search", require(__dirname + "/routes/user_others"));

// 06-event
app.use("/event", require(__dirname + "/routes/event"));

// 環境設定
app.use(express.static("public"));
const port = process.env.SERVER_PORT || 3002;
app.listen(port, () => {
  console.log("server started, server port: ", port);
});

module.exports = app;
