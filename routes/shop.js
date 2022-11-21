const express = require('express');
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors");

router.get('/',  async(req, res, next)=>{
    const shop_sql = "SELECT s.*, c.`shop_city`, a.`shop_area` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid`";
    const [shop_rows] = await db.query(shop_sql);
    res.json({ shop_rows});
  });
router.get('/shop_city',  async(req, res, next)=>{
    const city_sql = "SELECT * FROM `shop_address_city`";
    const [city_rows] = await db.query(city_sql);
    res.json({ city_rows});
  });
router.get('/shop_area',  async(req, res, next)=>{
    const area_sql = "SELECT * FROM `shop_address_area`";
    const [area_rows] = await db.query(area_sql);
    res.json({ area_rows});
  });
router.get('/shop_cate',  async(req, res, next)=>{
    const cate_sql = "SELECT * FROM `food_category`";
    const [cate_rows] = await db.query(cate_sql);
    res.json({ cate_rows});
  });
router.get('/test',  async(req, res, next)=>{
    const test_sql = "SELECT s.*, c.`shop_city`, a.`shop_area`, f.`product_name`, fc.`product_categories` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid` JOIN `food_product` f ON s.`sid` = f.`shop_list_sid` JOIN `food_category` fc ON f.`product_categories_sid` = fc.`sid`";
    const [test_rows] = await db.query(test_sql);
    const shop_dic = {};
    test_rows.forEach(r=>{
      const cate = r.product_categories
      if(shop_dic[r.sid]){
        if(!shop_dic[r.sid].cates.includes(cate)){
          shop_dic[r.sid].cates.push(cate);
        }
      } else {
        shop_dic[r.sid] = {r, cates:[cate]};
      }


    });


    res.json(shop_dic);
  });
  
module.exports = router;