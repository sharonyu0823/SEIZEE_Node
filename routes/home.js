var express = require('express');
var router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors");

/* GET home page. */
router.get('/',  async(req, res, next)=>{
  // res.render('index', { title: 'Express' });
  // const [shop_rows] = await db.query("SELECT * FROM `shop_list`");
  const shop_c_sql = "SELECT s.*, fc.`product_categories` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid` JOIN `food_product` f ON s.`sid` = f.`shop_list_sid` JOIN `food_category` fc ON f.`product_categories_sid` = fc.`sid` GROUP BY s.`sid`";
    const [shop_c_rows] = await db.query(shop_c_sql);
  res.json({ shop_c_rows });
});

module.exports = router;
