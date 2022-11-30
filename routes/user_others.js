const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");

// 記得使用JWT postman測試需要在headers加Authorization & Bearer --token--(這個要去前端登入後取得token/或後端取得也可以但要自己另外寫測試)

// 訂單查詢-訂單
router.get("/orders", async (req, res) => {
  const output = {
    success: false,
    error: "",
    row: [],
  };

  console.log("order");

  const sql = "SELECT * FROM `order-history` WHERE `mb_sid` = ?";
  const [row] = await db.query(sql, [res.locals.auth.mb_sid]);
  console.log(res.locals.auth.mb_sid);
  console.log(row);

  console.log("row.length", row.length);

  if (row.length >= 1) {
    output.success = true;
    output.row = row;
  }

  res.json(output);
});

// 訂單查詢-訂單細項
router.get("/order-details", async (req, res) => {
  const output = {
    success: false,
    error: "",
    row: [],
  };

  console.log("order-details");

  const sql = "SELECT * FROM `order-details` WHERE `order_num` = ?";
  const [row] = await db.query(sql, [req.body.mbOrderNum]);

  console.log(row);
  console.log(row.length);

  if (row.length >= 1) {
    output.success = true;
    output.row = row;
  }

  res.json(output);
});

module.exports = router;
