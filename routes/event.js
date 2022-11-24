const express = require('express');
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors"); 

router.get('/event-test/workshop', async(req, res, next)=>{
    const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 1;";
    const [test_rows] = await db.query(test_sql);
    res.json({test_rows});
})
router.get('/event-test/music', async(req, res, next)=>{
    const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 2;";
    const reigistered = "SELECT COUNT (1) FROM `event_registered` WHERE `event_all`.`event_sid` = 5";
    const [test_rows] = await db.query(test_sql);
    // const [reigistered_rows] = await db.query(reigistered);
    // console.log({registered_rows});
    res.json({test_rows});
})
router.get('/event-test/seminar', async(req, res, next)=>{
    const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 3;";
    const [test_rows] = await db.query(test_sql);
    res.json({test_rows});
})
router.get('/event-test/vr', async(req, res, next)=>{
    const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 4;";
    const [test_rows] = await db.query(test_sql);
    res.json({test_rows});
})
router.get('/event-test/theater', async(req, res, next)=>{
    const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 5;";
    const [test_rows] = await db.query(test_sql);
    res.json({test_rows});
})

module.exports = router;