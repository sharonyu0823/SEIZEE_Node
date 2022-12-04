const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors");

router.get("/", async (req, res, next) => {
  const shop_sql =
    "SELECT s.*, c.`shop_city`, a.`shop_area` ,fc.`category_name` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid` JOIN `food_product` f ON s.`sid` = f.`shop_list_sid` JOIN `product_category` fc ON f.`product_category_sid` = fc.`sid`";
  const [shop_rows] = await db.query(shop_sql);
  const shop_dic = {};
  shop_rows.forEach((rows) => {
    const cate = rows.category_name;
    if (shop_dic[rows.sid]) {
      if (!shop_dic[rows.sid].cates.includes(cate)) {
        shop_dic[rows.sid].cates.push(cate);
      }
    } else {
      shop_dic[rows.sid] = { rows, cates: [cate] };
    }
  });

  res.json(Object.values(shop_dic));
  //取出店家名稱
  // res.json(shop_dic[1].rows.shop_name);
  //取出種類名稱 第一個
  // res.json(shop_dic[1].cates[0]);
});

router.get("/shop_demo", async (req, res, next) => {
  const demo_sql =
    "SELECT s.* , c.`shop_city`, a.`shop_area` ,fc.`category_name` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid` JOIN `food_product` f ON s.`sid` = f.`shop_list_sid` JOIN `product_category` fc ON f.`product_category_sid` = fc.`sid` WHERE `shop_address_city_sid` = 2 AND `shop_address_area_sid`= 8";
  const [demo_rows] = await db.query(demo_sql);
  const demo_dic = {};
  demo_rows.forEach((rows) => {
    const cate = rows.category_name;
    if (demo_dic[rows.sid]) {
      if (!demo_dic[rows.sid].cates.includes(cate)) {
        demo_dic[rows.sid].cates.push(cate);
      }
    } else {
      demo_dic[rows.sid] = { rows, cates: [cate] };
    }
  });

  res.json(Object.values(demo_dic));
});

router.get("/shop_city", async (req, res, next) => {
  const city_sql = "SELECT * FROM `shop_address_city`";
  const [city_rows] = await db.query(city_sql);
  res.json({ city_rows });
});
router.get("/shop_area", async (req, res, next) => {
  const area_sql = "SELECT * FROM `shop_address_area`";
  const [area_rows] = await db.query(area_sql);
  res.json({ area_rows });
});
router.get("/shop_cate", async (req, res, next) => {
  const cate_sql = "SELECT * FROM `product_category`";
  const [cate_rows] = await db.query(cate_sql);
  res.json({ cate_rows });
});
router.get("/shop_love", async (req, res, next) => {
  const mb_sid = +req.query.mb_sid;
  if (!mb_sid) {
    return res.json({ message: '請先登入', code: '401' });
  }
  const lovemember_sql = `SELECT * FROM shop_loved JOIN shop_list ON shop_loved.loveshop_sid = shop_list.sid WHERE lovemb_sid=${mb_sid}`;

  const [lovemember_rows] = await db.query(lovemember_sql);
  res.json({ lovemember_rows });
});

// 取得收藏列表
router.get('/lovedList', async (req, res) => {

  const mb_sid = +req.query.mb_sid;
  //判斷登入
  if (!mb_sid) {
    return res.json({ message: '請先登入', code: '401' });
  }
  const love_sql = `SELECT * FROM shop_loved WHERE lovemb_sid=${mb_sid}`;
  const [love_rows] = await db.query(love_sql);
  res.json({love_rows});
});

// 新增收藏
router.get('/addLoved', async (req, res) => {

  const s_sid = req.query.s_sid;
  const mb_sid = req.query.mb_sid;

  // 判斷登入
  if (!mb_sid) res.json({ message: '請先登入', code: '401' });

  const addLoveSql =
    "INSERT INTO `shop_loved`(`loveshop_sid`, `lovemb_sid`) VALUES (?,?)";

  try {
    const [addLoveRows] = await db.query(addLoveSql, [s_sid, mb_sid]);

    res.json(addLoveRows);
    if (addLoveRows.addLoveSql) {
      return res.json({ message: 'success', code: '200' });
    } else {
      return res.json({ message: 'fail', code: '403' });
    }
  } catch (error) {
    console.log(error.message);
  }
});

// 移除收藏
router.get('/delLoved', async (req, res) => {

  const s_sid = req.query.s_sid;
  const mb_sid = req.query.mb_sid;

  const delLoveSql = 'DELETE FROM `shop_loved` WHERE loveshop_sid=? AND lovemb_sid=?';

  try {
    const [delLoveRows] = await db.query(delLoveSql, [s_sid, mb_sid]);

    res.json(delLoveRows);
    if (delLoveRows.delLoveSql) {
      return res.json({ message: 'success', code: '200' });
    } else {
      return res.json({ message: 'fail', code: '400' });
    }
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
