require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
// const upload = require(__dirname + "/modules/upload-img");

// top-level middleware
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    console.log({ origin: origin });
    callback(null, true);
  },
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(async (req, res, next) => {
  res.locals.auth = {}; // 預設值
  let auth = req.get("Authorization");

  if (auth && auth.indexOf("Bearer ") === 0) {
    auth = auth.slice(7);
    try {
      const payload = await jwt.verify(auth, process.env.JWT_SECRET);
      res.locals.auth = payload;
    } catch (ex) {}
  }

  next();
});

// routes
//00-home
app.use("/api/seizee", require(__dirname + "/routes/home"));
// 01-cart

// 02-forum
app.use("/forum",require(__dirname + "/routes/forum"));
// 03-shop
app.use("/api/shop", require(__dirname + "/routes/shop"));
// 04-product
app.use("/product", require(__dirname + "/routes/product"));

// 05-member
app.use("/user", require(__dirname + "/routes/user"));

// 06-event
app.use("/event", require(__dirname + "/routes/event"));

// 環境設定
app.use(express.static("public"));

const port = process.env.SERVER_PORT || 3002;
app.listen(port, () => {
  console.log("server started");
});

module.exports = app;
