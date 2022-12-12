const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const upload = require(__dirname + "/../modules/04_upload_img");
const cors = require("cors");
const sqlString = require("sqlstring");

//商品列表及細節頁
router.get("/list", async (req, res) => {
  const food_product_sid = req.query.sid;
  const shop_list_sid = req.query.shop_list_sid;
  const category_sid = req.query.category_sid;

  let whereCondition = "";
  if (shop_list_sid !== undefined) {
    whereCondition = "`food_product`.`shop_list_sid` = " + shop_list_sid;
  }
  if (food_product_sid !== undefined) {
    whereCondition = "`food_product`.`sid` = " + food_product_sid;
  }
  if (category_sid !== undefined) {
    if (whereCondition != "") whereCondition += " and ";
    whereCondition += "`food_product`.`product_category_sid`= " + category_sid;
  }
  if (whereCondition != "") whereCondition = " WHERE " + whereCondition;
  // console.log(whereCondition);
  let product_sql =
    " SELECT `food_product`.sid, `product_description`, `unit_price`, `product_price`, `sale_price`, `shop_list_sid`, `shop_name`, `shop_deadline`,`shop_address_detail`, `shop_city`, `shop_area`, `picture_url`, `product_category_sid`, `category_name`, `category_icon`, ROUND(AVG(rating)*2)/2 AS rating, case when total_inventory_qty is null then 0 else total_inventory_qty end - case when total_order_quantity is null then 0 else total_order_quantity end AS inventory_qty, food_product.`product_name`, food_product.`product_name` " +
    "FROM food_product " +
    "LEFT JOIN `shop_list` on `shop_list`.sid = shop_list_sid " +
    "LEFT JOIN `shop_address_area` on	`shop_address_area_sid` = `shop_address_area`.sid " +
    "LEFT JOIN `shop_address_city` on `shop_address_city_sid`= `shop_address_city`.sid " +
    "LEFT JOIN `product_picture` on `product_picture`.sid = (SELECT `product_picture`.sid FROM `product_picture` WHERE `food_product_sid` =`food_product`.sid ORDER BY `product_picture`.seq LIMIT 1) " +
    "LEFT JOIN `product_category` on `product_category`.`sid` = `product_category_sid` " +
    "LEFT JOIN ( select product_sid, sum(quantity) as total_order_quantity from `order_details` group by product_sid ) t1 on `product_sid` = `food_product`.`sid` " +
    "LEFT JOIN ( select food_product_sid, sum(inventory_qty) as total_inventory_qty " +
    "FROM `product_inventory` group by food_product_sid ) t2 on t2.`food_product_sid` = `food_product`.`sid` " +
    "LEFT JOIN `product_comment` on product_comment.food_product_sid=`food_product`.`sid` " +
    whereCondition +
    " GROUP BY `food_product`.sid, `product_description`, `unit_price`, `product_price`, `sale_price`, `shop_list_sid`, `shop_name`, `shop_deadline`,`shop_address_detail`, `picture_url`, `product_category_sid`, `category_name`, `category_icon`, case when total_inventory_qty is null then 0 else total_inventory_qty end - case when total_order_quantity is null then 0 else total_order_quantity end " +
    " ORDER BY `product_category_sid`, `food_product`.`sid` ";
  // console.log(product_sql);
  // return product_sql;
  const [product_rows] = await db.query(product_sql);

  let shop = null;
  if (product_rows.length) {
    const shop_list_sid = product_rows[0].shop_list_sid;
    const sql = `SELECT * FROM shop_list LEFT JOIN shop_address_area on	shop_address_area_sid = shop_address_area.sid LEFT JOIN shop_address_city on shop_address_city_sid = shop_address_city.sid WHERE shop_list.sid =? `;
    const [shop_data] = await db.query(sql, [shop_list_sid]);
    console.log(shop_data);

    if (shop_data.length) {
      shop = shop_data[0];
    }
  }
  res.json({ product_rows, shop });
  // res.json({ product_rows });
});

router.get("/suggest", async (req, res) => {
  const food_product_sid = +req.query.sid;
  let suggest_sql =
    "SELECT RAND() as r, `food_product`.sid, `food_product`.`product_name`, picture_url " +
    "FROM food_product " +
    "LEFT JOIN product_picture ON `product_picture`.sid =( SELECT `product_picture`.sid FROM product_picture " +
    "WHERE `food_product_sid`= `food_product`.sid " +
    "ORDER BY `product_picture`.sid " +
    "LIMIT 1 ) " +
    "WHERE `food_product`.product_category_sid in (SELECT product_category_sid " +
    "FROM food_product WHERE `food_product`.sid = " +
    food_product_sid +
    ") " +
    "AND `food_product`.sid <> " +
    food_product_sid +
    " order by r limit 6 ";
  //  console.log(suggest_sql);
  // return suggest_sql;
  const [suggest_rows] = await db.query(suggest_sql);
  res.json({ suggest_rows });
});

//商品新增收藏
router.get("/add", async (req, res) => {
  // if (!mb_sid) {
  //     return res.json({ message: 'error', code: '400' })
  //   }
  const mb_sid = req.query.mb_sid;
  const food_product_sid = req.query.sid;
  const addCollection =
    "INSERT INTO `product_collection` SET food_product_sid = ?, mb_sid = ? ";
  const format = sqlString.format(addCollection, [food_product_sid, mb_sid]);
  const [add_rows] = await db.query(format);
  res.json({ add_rows });
});

//商品取消收藏
router.get("/delete", async (req, res) => {
  const mb_sid = req.query.mb_sid;
  const food_product_sid = req.query.sid;
  const delectCollection =
    "DELETE FROM `product_collection` WHERE food_product_sid = ? AND mb_sid = ? ";
  const format = sqlString.format(delectCollection, [food_product_sid, mb_sid]);
  const [delect_rows] = await db.query(format);
  res.json({ delect_rows });
});

//商品列表頁抓收藏清單 mb_sid
router.get("/collection", async (req, res) => {
  const mb_sid = req.query.mb_sid === undefined ? "0" : req.query.mb_sid;
  let WHERE = "WHERE 1";
  // console.log(mb_sid);
  if (mb_sid != "0") {
    WHERE = `WHERE mb_sid=${mb_sid}`;
  }

  let collect_sql = `SELECT * FROM product_collection ${WHERE}`;
  // console.log(collect_sql);
  const [collection_rows] = await db.query(collect_sql);
  res.json({ collection_rows });
});

//商品細節頁抓收藏清單 food_product_sid
router.get("/collect", async (req, res) => {
  const sid = req.query.sid;
  const collect =
    "SELECT * FROM `product_collection` WHERE food_product_sid = ? ";
  const format = sqlString.format(collect, [sid]);
  const [rows] = await db.query(format);
  res.json({ rows });
});

//商品輪播牆用group_concat把picture_url綁定
router.get("/picture", async (req, res) => {
  const sid = req.query.sid;
  const product_picture_sid = req.query.product_picture_sid;
  const picture_sql =
    "SELECT `food_product`.sid, `shop_list_sid`, group_concat (picture_url) AS picture FROM `food_product` " +
    "LEFT JOIN `product_picture` ON `food_product_sid`= `food_product`.sid " +
    "WHERE `food_product`.sid = ? " +
    "GROUP BY food_product.sid, `shop_list_sid` ";
  // console.log(picture_sql);
  // return picture_sql;
  const [product_rows] = await db.query(picture_sql, [sid]);
  res.json({ product_rows });
});

//商品留言+評分
router.post("/comment", upload.none(), async (req, res) => {
  const { food_product_sid, mb_sid, comment, rating } = req.body;

  if (!food_product_sid || !mb_sid || !comment) {
    return res.json({ success: false });
  }
  const commentsql =
    "INSERT INTO `product_comment`( `food_product_sid`, `mb_sid`, `user_comment`, `rating`, `created_at`) VALUES (?,?,?,?,NOW()) ";

  const [result] = await db.query(commentsql, [
    food_product_sid,
    mb_sid,
    comment,
    rating,
  ]);
  res.json({ result, success: true });
});

// 抓評分數和留言
router.get("/userComment/:sid", async (req, res) => {
  const food_product_sid = req.params.sid;
  const sql =
    "SELECT c.* ,ROUND(AVG(rating)*2)/2 AS rating, m.`mb_photo`, m.`mb_name` FROM `product_comment` c JOIN `member` m ON c.`mb_sid`=m.mb_sid WHERE c.food_product_sid = ? ";
  const [rows] = await db.query(sql, [food_product_sid])
  res.json(rows);
});

//商品篩選
router.post("/productFilter", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };
  let filter = "";
  if (req.body.categories && req.body.categories.length) {
    filter += " WHERE `product_category_sid` IN (" + req.body.categories + ") ";
  }

  if (req.body.fiftyPercentOff) {
    filter += " AND sale_price <= 5 ";
  }
  if (req.body.priceUnder50) {
    filter += " AND product_price <= 50 ";
  }
  if (req.body.priceOver100) {
    filter += " AND product_price >= 100 ";
  }
  if (req.body.ratingOver4) {
    filter += " AND rating >= 4 ";
  }

  let category =
    "SELECT `food_product`.sid, `picture_url`, `product_name`, `unit_price`, `product_price`,`sale_price`, `product_description`, ROUND(AVG(rating)*2)/2 AS rating, case when total_inventory_qty is null then 0 else total_inventory_qty end - case when total_order_quantity is null then 0 else total_order_quantity end as qty FROM `food_product` " +
    "LEFT JOIN `product_picture` on `product_picture`.sid = (SELECT `product_picture`.sid FROM `product_picture` WHERE `food_product_sid` =`food_product`.sid ORDER BY `product_picture`.seq LIMIT 1) " +
    "LEFT JOIN ( select product_sid, sum(quantity) as total_order_quantity from `order_details` group by product_sid ) t1 on `product_sid` = `food_product`.`sid` " +
    "LEFT JOIN product_comment on product_comment.food_product_sid = food_product.sid " +
    "LEFT JOIN ( select food_product_sid, sum(inventory_qty) as total_inventory_qty " +
    "from `product_inventory` group by food_product_sid ) t2 on t2.`food_product_sid` = `food_product`.`sid` " +
    filter +
    " GROUP BY `food_product`.sid, `picture_url`, `product_name`, `unit_price`, `product_price`,`sale_price`, `product_description`, case when total_inventory_qty is null then 0 else total_inventory_qty end - case when total_order_quantity is null then 0 else total_order_quantity end ";

  const [filter_rows] = await db.query(category);
  // console.log(category);
  // console.log(filter_rows);
  // console.log('productFilter - ' + category);
  res.json({ filter_rows });
});

//商品種類
router.get("/category", async (req, res) => {
  const category_sid = req.query.category_sid;
  // console.log({ category_sid });
  let category = "SELECT * FROM `product_category`";
  if (category_sid && category_sid.length) {
    category =
      "SELECT `food_product`.sid, `picture_url`, `product_name`, `unit_price`, `product_price`,`sale_price`, `product_description`, ROUND(AVG(rating)*2)/2 AS rating, case when total_inventory_qty is null then 0 else total_inventory_qty end - case when total_order_quantity is null then 0 else total_order_quantity end as qty FROM `food_product` " +
      "LEFT JOIN `product_picture` ON `product_picture`.sid =( SELECT `product_picture`.sid FROM `product_picture` " +
      "WHERE `food_product_sid`= `food_product`.sid " +
      "ORDER BY `product_picture`.sid " +
      "LIMIT 1 ) " +
      "LEFT JOIN ( select product_sid, sum(quantity) as total_order_quantity from `order_details` group by product_sid ) t1 on `product_sid` = `food_product`.`sid` " +
      "LEFT JOIN product_comment on product_comment.food_product_sid = food_product.sid " +
      "LEFT JOIN ( select food_product_sid, sum(inventory_qty) as total_inventory_qty " +
      "from `product_inventory` group by food_product_sid ) t2 on t2.`food_product_sid` = `food_product`.`sid`";
    if (category_sid && category_sid.length) {
      category += " WHERE `product_category_sid` IN (" + category_sid + ") ";
    }
    category +=
      " GROUP BY `food_product`.sid, `picture_url`, `product_name`, `unit_price`, `product_price`,`sale_price`, `product_description`, case when total_inventory_qty is null then 0 else total_inventory_qty end - case when total_order_quantity is null then 0 else total_order_quantity end ";
  }
  const [category_rows] = await db.query(category);
  // console.log(category_rows);
  res.json({ category_rows });
});

module.exports = router;