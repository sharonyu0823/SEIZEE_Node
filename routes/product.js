const express = require('express');
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const upload = require(__dirname + "/../modules/04_upload_img")
const cors = require("cors");
const sqlString=require('sqlstring');

//商品列表及細節頁
router.get('/list', async (req, res) => {
    const shop_list_sid = req.query.shop_list_sid
    const category_sid = req.query.category_sid
    const food_product_sid = req.query.sid

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
    let product_sql = " SELECT `food_product`.sid, `shop_list_sid`, `shop_name`, `shop_deadline`, `picture_url`, food_product.`product_name`, `product_category_sid`, `category_name`, `category_icon`,`product_description`, `unit_price`, `sale_price`, `product_launch`, SUM(inventory_qty) - SUM(case when `order_details`.quantity is null then 0 else `order_details`.quantity end) AS inventory_qty " + 
    "FROM food_product " +
    "LEFT JOIN shop_list on `shop_list`.sid = shop_list_sid " + 
    "LEFT JOIN `product_picture` on `product_picture`.`food_product_sid` = `food_product`.sid " + 
    "LEFT JOIN `product_category` on `product_category`.`sid` = `product_category_sid` " +
    "LEFT JOIN `product_inventory` on `product_inventory`.sid = `food_product`.sid " +
    "LEFT JOIN `order_details` on `product_sid` = `food_product`.sid " +
    whereCondition +  
    " GROUP BY `food_product`.sid, `shop_list_sid`, `shop_name`, `shop_deadline`, `picture_url`, food_product.`product_name`, `product_category_sid`, `category_name`, `category_icon`,`product_description`, `unit_price`, `sale_price`, `product_launch`, `inventory_qty` " +
    " ORDER BY `product_category_sid`, `food_product`.`sid`"
    //  console.log(product_sql);
    // return product_sql;
    const [product_rows] = await db.query(product_sql)

    let shop = null;
    if(product_rows.length){
        const shop_list_sid = product_rows[0].shop_list_sid;
        const sql = `SELECT * FROM shop_list WHERE sid =?`
        const [shop_data] = await db.query(sql, [shop_list_sid]);

        if(shop_data.length){
            shop = shop_data[0];
        }
    }
    res.json({product_rows, shop})
})

//隨機推薦相關產品
router.get('/suggest', async (req, res) => {
    const food_product_sid = req.query.sid
    let suggest_sql = "SELECT RAND() as r, `food_product`.sid, `picture_url` " +
    "FROM `food_product` " +
    "LEFT JOIN `product_picture` ON `product_picture`.sid =( SELECT `product_picture`.sid FROM `product_picture` " +
    "WHERE `food_product_sid`= `food_product`.sid " +
    "ORDER BY `product_picture`.sid " +
    "LIMIT 1 ) " +
    "WHERE `food_product`.product_category_sid in (SELECT `product_category_sid` " +
    "FROM `food_product` WHERE `food_product`.sid = " + food_product_sid + ") " +
    "AND `food_product`.sid <> " + food_product_sid +
    " order by r limit 5 ";
    //  console.log(suggest_sql);
    // return suggest_sql;
    const [suggest_rows] = await db.query(suggest_sql)
    res.json({suggest_rows})
})

//商品新增收藏
router.get("/add", async (req, res) => {
    // if (!mb_sid) {
    //     return res.json({ message: 'error', code: '400' })
    //   }
    const mb_sid = req.query.mb_sid;
    const food_product_sid = req.query.sid;
    const addCollection =
    "INSERT INTO `product_collection` SET food_product_sid = ?, mb_sid = ? ";
    const format = sqlString.format(addCollection, [food_product_sid, mb_sid])
    const [add_rows] = await db.query(format)
    res.json({add_rows})
  })

//商品取消收藏
router.get('/delete', async (req, res) => {
    const mb_sid = req.query.mb_sid;
    const food_product_sid = req.query.sid;
    const delectCollection =
    "DELETE FROM `product_collection` WHERE food_product_sid = ? AND mb_sid = ? ";
    const format = sqlString.format(delectCollection, [food_product_sid, mb_sid])
    const [delect_rows] = await db.query(format)
    res.json({delect_rows}) 
  })

//商品列表頁抓收藏清單 mb_sid
router.get('/collection', async (req,res) => {
    const mb_sid = req.query.mb_sid === undefined ? '0' : req.query.mb_sid
    let WHERE='WHERE 1'
    // console.log(mb_sid);
    if (mb_sid != '0'){
        WHERE = `WHERE mb_sid=${mb_sid}`}
        
    let collect_sql = `SELECT * FROM product_collection ${WHERE}`
    // console.log(collect_sql);
    const [collection_rows] = await db.query(collect_sql)
    res.json({collection_rows})
    
})

//商品細節頁抓收藏清單 food_product_sid
router.get('/collect',async(req,res)=>{
    const sid = req.query.sid
    const collect =
    "SELECT * FROM `product_collection` WHERE food_product_sid = ? ";
    const format = sqlString.format(collect, [sid])
    const [rows] = await db.query(format)
    res.json({rows}) 
})

//商品輪播牆用group_concat把picture_url綁定
router.get('/picture', async (req, res) => {
    const sid = req.query.sid
    const product_picture_sid = req.query.product_picture_sid
    const picture_sql = "SELECT `food_product`.sid, `shop_list_sid`, group_concat(trim(both char(13) from picture_url)) AS picture FROM `food_product` " +
    // "LEFT JOIN `product_category` ON `product_category`.sid = `product_category_sid`" +
    "LEFT JOIN `product_picture` ON `food_product_sid`= `food_product`.sid " +
    "WHERE `food_product`.sid  " +
    "GROUP BY food_product.sid, `shop_list_sid` " 
    // console.log(picture_sql);
    // return picture_sql;
    const [product_rows] = await db.query(picture_sql)
    res.json({product_rows})
})

//商品留言
router.post('/comment', upload.none(), async (req, res) => {
    const comment = {
        success:false,
        code:0,
        error:{},
        poseData:req.body, //除錯用
    }
    const commentsql = "INSERT INTO `product_comment`( `food_product_sid`, `mb_sid`, `user_comment`, `created_at`) VALUES (?,?,?,NOW()) "
    // console.log(req.body);
    const [comment_rows] = await db.query(commentsql,[
        req.body.food_product_sid,
        req.body.mb_sid,
        req.body.comment,
    ])
   
    if(comment.comment_rows) 
    comment.success = true;
    res.json({comment})
})

//篩選所有商品種類
router.get('/filterCategory', async (req, res) => {
    const category_sid = req.query.category_sid
    const filter_sql = "SELECT `food_product`.sid, `picture_url`, `product_name`, `product_description` From `food_product` LEFT JOIN `product_picture` on `product_picture`.`food_product_sid` = `food_product`.sid " +
    "WHERE `product_category_sid` IN (" + category_sid + ") "
    // console.log(filter_sql);
    const [filter_rows] = await db.query(filter_sql)
    res.json({filter_rows})
}) 

//篩選
// router.get('/filter', async (req, res) => {
//     const category_sid = req.query.category_sid
//     const filter_sql = "SELECT `food_product`.sid, `picture_url`, `product_name`, `product_description`, `unit_price`, `sale_price`, `product_launch`, `category_name`, `category_icon` FROM `food_product`LEFT JOIN `product_picture` ON `product_picture`.`food_product_sid` = `food_product`.sid " +
//     "LEFT JOIN `product_category` ON `product_category`.sid = `product_category_sid` " +
//     "WHERE `product_category_sid` "
//     const [filter_rows] = await db.query(filter_sql)
//     res.json({filter_rows})
// })

//商品種類
router.get('/category', async (req, res) => {
    const sid = req.query.sid
    const category_sql ="SELECT * FROM `product_category` "
    const format = sqlString.format(category_sql, [sid])
    const [category_rows] = await db.query(format)
    res.json({category_rows}) 
})
      

// app.post("/category", (req, res) => {
//     res.json(req.body);

// const categorysql = "SELECT `category` * FROM category "
// const [filter_rows] = await db.query(filter_sql)
// res.json({filter_rows})
// })

module.exports = router;