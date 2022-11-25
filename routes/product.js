const express = require('express');
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect2");
const cors = require("cors");

//商品列表及細節頁
router.get('/list', async (req, res) => {
    const shop_list_sid = req.query.shop_list_sid
    const category_sid = req.query.category_sid
    const food_product_sid = req.query.sid
    const member_sid = req.query.member_sid === undefined ? '0' : req.query.member_sid

    let collectionJoinCondition = ''
    if (member_sid !== undefined)
        collectionJoinCondition = 'LEFT JOIN product_collection ON `product_collection`.`member_sid` =  ' + member_sid + ' AND `product_collection`.`food_product_sid` = `food_product`.`sid`' + '\n'
    let whereCondition = ''
    if (shop_list_sid !== undefined) {
        whereCondition = '`food_product`.`shop_list_sid` = ' + shop_list_sid
    }
    if ( food_product_sid !== undefined) {
        whereCondition = '`food_product`.`sid` = ' + food_product_sid
    }
    if (category_sid !== undefined) {
        if (whereCondition != '')
            whereCondition += ' and '  
        whereCondition += '`food_product`.`product_category_sid`= ' + category_sid
    }
    if (whereCondition != '')
        whereCondition = ' WHERE ' + whereCondition
    // console.log(whereCondition);
    let product_sql = " SELECT `food_product`.sid, `shop_list_sid`, `shop_name`, `shop_deadline`, `picture_url`, `product_name`, `product_category_sid`, `category_name`, `category_icon`,`product_description`, `unit_price`, `sale_price`, `product_launch`, `inventory_qty`,  member_sid " + 
    "FROM food_product " +
    "LEFT JOIN shop_list on `shop_list`.sid = shop_list_sid " + 
    "LEFT JOIN product_picture on `product_picture`.`food_product_sid` = `food_product`.sid " + 
    "LEFT JOIN product_category on `product_category`.`sid` = product_category_sid " +
    collectionJoinCondition + 
    whereCondition + 
    ' ORDER BY `product_category_sid`, `food_product`.`sid`'
    //  console.log(product_sql);
    // return product_sql;
    const [product_rows] = await db.query(product_sql)
    res.json({product_rows})
})

//商品新增收藏
router.get("/add", async (req, res) => {
    // if (!member_sid) {
    //     return res.json({ message: 'error', code: '400' })
    //   }
    const member_sid = req.query.member_sid;
    const food_product_sid = req.query.sid;
    const addCollection =
    "INSERT INTO `product_collection` SET food_product_sid = ?, member_sid = ? ";
  })

//商品取消收藏
router.get('/delete', async (req, res) => {
    const member_sid = req.query.member_sid;
    const food_product_sid = req.query.food_product_sid;
    const delectCollection =
    "DELETE FROM `product_collection` WHERE food_product_sid = ? AND member_sid = ? ";
  })

//商品收藏清單
router.get('/collection', async (req,res) => {
    const member_sid = req.query.member_sid === undefined ? '0' : req.query.member_sid
    let collect_sql = "SELECT * FROM `product_collection` "
    // "LEFT JOIN product_collection ON `product_collection`.`member_sid` =  ' + member_sid + ' AND `product_collection`.`food_product_sid` = `food_product`.`sid`"
    const [collection_rows] = await db.query(collect_sql)
    res.json({collect_sql})
})

//隨機推薦相關產品
router.get('/suggest', async (req, res) => {
    const food_product_sid = req.query.food_product_sid
    let suggest_sql = "SELECT RAND() as r, `food_product`.sid, `picture_url` " +
    "FROM `food_product` " +
    "LEFT JOIN `product_picture` ON `product_picture`.sid =( SELECT `product_picture`.sid FROM `product_picture` " +
    "WHERE `food_product_sid`= `food_product`.sid " +
    "ORDER BY `product_picture`.sid " +
    "LIMIT 1 ) " +
    "WHERE `food_product`.product_category_sid in (SELECT `product_category_sid` " +
    "FROM `food_product` WHERE `food_product`.sid = 1) " +
    "AND `food_product`.sid <> 1 " +
    "order by r limit 3 ";
    //  console.log(suggest_sql);
    // return suggest_sql;
    const [suggest_rows] = await db.query(suggest_sql)
    res.json({suggest_rows})
})

//商品輪播牆用group_concat把picture_url綁定
router.get('/picture', async (req, res) => {
    const product_picture_sid = req.query.product_picture_sid
    let picture_sql = "SELECT food_product.sid, `shop_list_sid`, `product_category_sid`, `category_name`, group_concat(picture_url)" +
    "FROM `food_product` " +
    "LEFT JOIN `product_category` ON `product_category`.sid = `product_category_sid`" +
    "LEFT JOIN `product_picture` ON `food_product_sid`= `food_product`.sid " +
    "WHERE food_product.sid < 10 " +
    "GROUP BY food_product.sid, `shop_list_sid`, `product_category_sid`, `category_name` " 
    // console.log(picture_sql);
    // return picture_sql;
    const [product_rows] = await db.query(picture_sql)
    res.json({product_rows})
})

module.exports = router;