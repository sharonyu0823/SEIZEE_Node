const express = require("express");
const router = express.Router();
const db = require(__dirname + '/../modules/db_connect');
const cors = require("cors");


// 測試用
router.get('/test123', async (req, res) => {
    const test_sql = "SELECT * FROM `order_history` JOIN `order_details` ON `order_history`.`order_num`=`order_details`.`order_num` WHERE 1";
    const [test_rows] = await db.query(test_sql);
    res.json({test_rows});

})

// 測試2，帶會員資料
router.get('/info/:sid', async (req, res) => {
    const sid = req.params.sid;
    // res.json(req.params);
    const member_info_sql = `SELECT * FROM member WHERE mb_sid = ${sid}`;
    const [member_info_rows]  = await db.query(member_info_sql);
    const row = {...member_info_rows}
    // console.log(row);

    if(row[0]) {
        // console.log(row[0].member_nickname);
        res.json({member_info_rows});
    } else {
        res.send('這個sid沒有對應的會員資料');
    }
})

// CartList - 帶出店家營業、取餐資料
router.get('/shop/:shopsid', async (req, res) => {
    const shopsid = req.params.shopsid;
    const shop_info_sql = `SELECT * FROM shop_list 
    JOIN shop_address_city ON shop_list.shop_address_city_sid = shop_address_city.sid 
    JOIN shop_address_area ON shop_list.shop_address_area_sid = shop_address_area.sid 
    WHERE shop_list.sid = ${shopsid}`;
    const [shop_info_rows]  = await db.query(shop_info_sql);
    const row = {...shop_info_rows}

    if(row[0]) {
        // console.log(row[0].shop_name);
        res.json({shop_info_rows});
    } else {
        res.send('這個sid沒有對應的商家資料');
    }
})

// CartList - 推薦商品
router.get('/rec-merch/:prodsid', async (req, res) => {
    const prodsid = req.params.prodsid;
    const rec_merch_sql = `SELECT * FROM food_product 
    JOIN product_inventory ON food_product.sid = product_inventory.food_product_sid 
    JOIN product_picture ON food_product.sid = product_picture.food_product_sid
    WHERE shop_list_sid = ${prodsid} 
    && product_launch = 1 
    && inventory_qty > 0`;
    const [rec_merch_rows]  = await db.query(rec_merch_sql);
    const row = {...rec_merch_rows}

    if(row) {
        // console.log(row[0].product_name);
        res.json({rec_merch_rows});
    } else {
        res.send('這個sid沒有對應的商家資料');
    }
})

// CartList - 加入收藏清單（待完成）

// CartInfo - 代入會員資料、店家資料
// 店家資料部分跟 CartList 共用同個 router
router.get('/mb/:mbsid', async (req, res) => {
    const mbsid = req.params.mbsid

    const member_info_sql = `SELECT * FROM member WHERE mb_sid = ${mbsid}`;
    const [member_info_rows]  = await db.query(member_info_sql);
    const row = {...member_info_rows}
    // console.log(row); 

    if(row[0]) {
        // console.log(row[0].member_nickname);
        res.json({member_info_rows});
    } else {
        res.send('這個sid沒有對應的會員資料');
    }
})

// CartDone - 將付款成功的訂單寫入資料庫（待完成）
// 歷史訂單+訂單明細+會員sid+商品列表
router.get('/add-order/:ordernum', async (req, res) => {
    const ordernum = req.params.ordernum
    const create_order_sql = ``;

})


// CartDone - 訂單成功頁面帶出該筆訂單明細
// 歷史訂單+訂單明細+會員sid+商品列表
router.get('/payment-done/:mbsid', async (req, res) => {
    const mbsid = req.params.mbsid

    const this_order_details_sql = `SELECT * FROM order_history
    JOIN order_details ON order_history.order_num = order_details.order_num
    WHERE order_history.member_sid = ${mbsid}
    ORDER BY order_history.created_at DESC`;
    const [this_order_details_rows] = await db.query(this_order_details_sql);
    const row =  { ...this_order_details_rows}; 

    if(row[0]) {
        // console.log(row[0]);
        res.json({this_order_details_rows});
    } else {
        res.send('這個會員沒有對應的訂單記錄');
    }

})

module.exports = router;