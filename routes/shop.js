const express = require('express');
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors");

router.get('/',  async(req, res, next)=>{
    const shop_sql = "SELECT s.*, c.`shop_city`, a.`shop_area`, fc.`product_categories` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid` JOIN `food_product` f ON s.`sid` = f.`shop_list_sid` JOIN `food_category` fc ON f.`product_categories_sid` = fc.`sid` GROUP BY s.`sid`";
    const [shop_rows] = await db.query(shop_sql);
    res.json({ shop_rows });
  });
  
module.exports = router;