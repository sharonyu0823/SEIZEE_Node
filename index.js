require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

// top-level middleware
app.use(express.json());

app.use(cors())


// routes
// 01-cart

// 02-forum
app.use("/forum",require(__dirname + "/routes/forum"));
// 03-shop

// 04-product

// 05-member

// 06-event


// 環境設定

const port = process.env.SERVER_PORT || 3002;
app.listen(port, () => {
  console.log("server started");
});

module.exports = app;