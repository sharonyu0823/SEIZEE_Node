const express = require('express');
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");

router.get('/', async (req, res) => {
    // console.log("product_list")
    const shop_list_sid = req.query.shop_list_sid
    const category_sid = req.query.category_sid
    // const member_sid = req.session.member_sid
    const member_sid = req.query.member_sid === undefined ? '0' : req.query.member_sid

    let collectionJoinCondition = ''
    if (member_sid !== undefined)
        collectionJoinCondition = 'LEFT JOIN `member_product_collection` ON `member_product_collection`.`member_sid` = ' + member_sid + ' AND `member_product_collection`.`food_product_sid` = `food_product`.`sid`' + '\n'
    let whereCondition = ''
    if (shop_list_sid !== undefined) {
        whereCondition = '`food_product`.`shop_list_sid` = ' + shop_list_sid
    }
    // console.log(whereCondition);
    if (category_sid !== undefined) {
        if (whereCondition != '')
            whereCondition += ' and '  
        whereCondition += '`food_product`.`product_category_sid`= ' + category_sid
    }
    // console.log(whereCondition);
    let p_sql = "SELECT `food_product`.sid, `shop_list_sid`, `shop_name`, `shop_deadline`, `picture_url`, `product_name`, `product_category_sid`, `category_name`, `product_description`, `unit_price`, `sale_price`, `product_launch`, `inventory_qty`, `member_sid` " + 
    "FROM `food_product` " +
    "LEFT JOIN `shop_list` on`shop_list`.sid = `shop_list_sid` " + 
    "LEFT JOIN `product_picture` on `product_picture`.`food_product_sid` = `food_product`.sid " + 
    "LEFT JOIN `product_category` on `product_category`.`sid` = `product_category_sid` " +
     collectionJoinCondition + 
     ' WHERE ' + whereCondition + 
     ' ORDER BY `product_category_sid`, `food_product`.`sid`'
    
    const [rows] = await db.query(p_sql)
    res.json([rows])
})

module.exports = router;