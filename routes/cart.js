const express = require("express");
const router = express.Router();
const db = require(__dirname + '/../modules/db_connect');
const cors = require("cors");



router.get('/test123', async (req, res) => {
    const test_sql = "SELECT * FROM `order-history` JOIN `order-details` ON `order-history`.`order_num`=`order-details`.`order_num` WHERE 1";
    const [test_rows] = await db.query(test_sql);
    res.json({test_rows});

})

router.get('/info/:sid', async (req, res) => {
    const sid = req.params.sid;
    // res.json(req.params);
    const member_info_sql = `SELECT * FROM member WHERE member_sid = ${sid}`;
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

router.get('/shop/:sid', async (req, res) => {
    const sid = req.params.sid;
    const shop_info_sql = `SELECT * FROM shop_list WHERE sid = ${sid}`;
    const [shop_info_rows]  = await db.query(shop_info_sql);
    const row = {...shop_info_rows}

    if(row[0]) {
        console.log(row[0].shop_name);
        res.json({shop_info_rows});
    } else {
        res.send('這個sid沒有對應的商家資料');
    }
})

module.exports = router;