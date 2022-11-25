require("dotenv").config();
const express = require("express");
const app = express();
const db = require(__dirname + "/modules/db_connect");
const cors = require("cors");

// routes
// 01-cart

// 02-forum

// 03-shop

// 04-product
app.use("/product", require(__dirname + "/routes/product"));

// 05-member

// 06-event


// 環境設定

const port = process.env.SERVER_PORT || 3002;
app.listen(port, () => {
  console.log("server started");
});


