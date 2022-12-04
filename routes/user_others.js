const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");

// 記得使用JWT postman測試需要在headers加Authorization & Bearer --token--(這個要去前端登入後取得token/或後端取得也可以但要自己另外寫測試)
// ====================================
// 訂單查詢-訂單
router.get("/orders", async (req, res) => {
  const output = {
    success: false,
    error: "",
    row: [],
  };

  // console.log("order");

  const sql =
    "SELECT oh.*, os.`order_status_name` FROM `order_history` oh JOIN `order_status` os ON oh.`order_status_sid` = os.`sid` WHERE `mb_sid` = ?";

  // const sql = "SELECT * FROM `order_history` WHERE `mb_sid` = ?";
  const [row] = await db.query(sql, [res.locals.auth.mb_sid]);
  // console.log(res.locals.auth.mb_sid);
  // console.log(row);

  // console.log("row.length", row.length);

  if (row.length >= 1) {
    output.success = true;
    output.row = row;
  }

  res.json(output);
});

// 訂單查詢-訂單細項
router.post("/order-details", async (req, res) => {
  const output = {
    success: false,
    error: "",
    row: [],
  };

  // console.log("order-details");
  // console.log('req.body', req.body);

  const sql = "SELECT * FROM `order_details` WHERE `order_num` = ?";
  const [row] = await db.query(sql, [req.body.mbOrderNum]);

  // console.log(row);
  // console.log(row.length);

  if (row.length >= 1) {
    output.success = true;
    output.row = row;
  }

  res.json(output);
});

// ====================================
// 我的收藏-商品
router.get("/likes-product", async (req, res) => {
  const output = {
    success: false,
    error: "",
    row: [],
  };

  const sql =
    "SELECT p.sid, p.product_name, p.product_price, pp.picture_url FROM food_product p JOIN product_collection pc ON p.sid=pc.food_product_sid LEFT JOIN (SELECT pp.food_product_sid, pp.picture_url FROM product_picture pp INNER JOIN( SELECT MIN(pp2.sid) ppsid FROM product_picture pp2 group by pp2.food_product_sid) pp2 on pp2.ppsid = pp.sid) pp ON pp.food_product_sid = p.sid WHERE pc.mb_sid=?";

  const [row] = await db.query(sql, [res.locals.auth.mb_sid]);

  // console.log(row);
  // console.log(row.length);

  if (row.length >= 1) {
    output.success = true;
    output.row = row;
  }

  res.json(output);
});

module.exports = router;
