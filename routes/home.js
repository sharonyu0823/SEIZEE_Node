var express = require('express');
var router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors");

/* GET home page. */
// router.get('/',  async(req, res, next)=>{
//   const shop_sql = "SELECT s.*, c.`shop_city`, a.`shop_area` ,fc.`product_categories` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid` JOIN `food_product` f ON s.`sid` = f.`shop_list_sid` JOIN `food_category` fc ON f.`product_categories_sid` = fc.`sid`";
//   const [shop_rows] = await db.query(shop_sql);
//   const shop_dic = {};
//   shop_rows.forEach(rows=>{
//     const cate = rows.product_categories
//     if(shop_dic[rows.sid]){
//       if(!shop_dic[rows.sid].cates.includes(cate)){
//         shop_dic[rows.sid].cates.push(cate);
//       }
//     } else {
//       shop_dic[rows.sid] = {rows, cates:[cate]};
//     }
//   });
  
//   res.json(Object.values(shop_dic));
//   // 花括號讓裡面的值成為key
// });

module.exports = router;
