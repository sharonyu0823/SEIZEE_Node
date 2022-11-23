const express = require("express");
const router = express.Router();
const db = require(__dirname + '/../modules/db_connect');
const cors = require("cors");

router.get('/cart/list', async (req, res) => {
    const test_sql = "SELECT * FROM `orders` JOIN `order_details` on `orders`.`order_sid` = `order_details`.`order_sid`";
    const [test_rows] = await db.qury(test_sql);
    res.json({test_rows});
})

module.exports = router;