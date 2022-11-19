require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

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

// routes
// 01-cart

// 02-forum

// 03-shop

// 04-product
app.use("/product_list", require(__dirname + "/routes/product"));

// 05-member
app.use("/user", require(__dirname + "/routes/user"));

// 06-event

// 環境設定

const port = process.env.SERVER_PORT || 3002;
app.listen(port, () => {
  console.log("server started");
});
