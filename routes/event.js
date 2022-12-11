const express = require('express');
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors"); 

router.post('/event-test', async(req, res)=>{
    const {memberSid} = req.body
    const test_sql = "SELECT event_all.*, event_style.styles FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid`;";
    const [test_rows] = await db.query(test_sql);
    // console.log(test_rows)
    for (let row of test_rows) {
        const sql = "SELECT * FROM event_likes WHERE member_sid = ? AND event_sid = ?"
        const [rows] = await db.query(sql, [memberSid, row.sid]);
        if (rows.length) {
            row.like = true;
        } else {
            row.like = false;
        }
    }

    res.json(test_rows); 
})

router.post('/all_event_likes', async (req,res) => {
    const memberSid = req.body.memberSid ? +req.body.memberSid : 0;
    let sql = `SELECT event_sid FROM event_likes WHERE member_sid=?`;
    const [rows] = await db.query(sql, [memberSid]);
    res.json(rows);
})

//收藏
router.post('/event_toggle', async (req,res) => {
    //eventSid, memberSid
    const eventSid = req.body.eventSid ? +req.body.eventSid : 0;
    const memberSid = req.body.memberSid ? +req.body.memberSid : 0;

    if(!eventSid || !memberSid) return res.json({success: false});

    let sql = `SELECT * FROM event_likes WHERE member_sid=? AND event_sid=? `;
    const [rows] = await db.query(sql, [memberSid, eventSid]);
    if(rows.length){
        // had
        let sql_del = `DELETE FROM event_likes WHERE member_sid=? AND event_sid=? `;
        await db.query(sql_del, [memberSid, eventSid]);
        res.json({success: true, memberSid, eventSid, msg:'delete'});
    } else {
        
        let sql_insert = `INSERT INTO event_likes (member_sid, event_sid, created_at) VALUES (?, ?, NOW())`;
        await db.query(sql_insert, [memberSid, eventSid]);
        res.json({success: true, memberSid, eventSid, msg:'insert'});
    }

})
/*
router.post('/event-add', async(req, res)=>{
    const {memberSid, eventSid} = req.body
    const sql_likes = "INSERT INTO event_likes (member_sid, event_sid, created_at) VALUES (?, ?, current_timestamp());";
    const [test_rows] = await db.query(sql_likes, [memberSid, eventSid]);
    res.json({
        ok: true
    }); 
})
*/
router.post('/event-ticket', async(req, res)=>{
    const {memberSid, timeTable} = req.body
    if(timeTable && timeTable.length) {
        for(let item of timeTable){
            if(item.name){

                // const event_sql = "SELECT * FROM `event_registered` WHERE member_sid = ?"
                // const [event_rows] = await db.query(event_sql, [
                //     memberSid,
                //     item.sid,
                // ]);


                const test_sql = "INSERT INTO event_registered (member_sid, event_sid) VALUES (?, ?)";
                const [test_rows] = await db.query(test_sql, [
                    memberSid,
                    item.sid,
                ]);
                const sql = "UPDATE event_all SET registered = registered + 1 WHERE sid = ? ";
                const [rows] = await db.query(sql, [item.sid])
                console.log('tset12312331')
            }
    
        }
    }
    // console.log(res.body);
    res.send('registered')
   
    // res.json(test_rows);
})

router.get('/event-registered/:eventSid', async(req, res)=>{
    const eventSid = req.params.eventSid
    const test_sql = `SELECT COUNT(1) FROM event_registered WHERE event_sid = ${eventSid}`;
    const [test_rows] = await db.query(test_sql);
    res.json(test_rows);
})
// router.get('/event-test/workshop', async(req, res, next)=>{
//     const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 1;";
//     const [test_rows] = await db.query(test_sql);
//     res.json({test_rows});
// })
// router.get('/event-test/music', async(req, res, next)=>{
//     const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 2;";
//     const reigistered = "SELECT COUNT (1) FROM `event_registered` WHERE `event_all`.`event_sid` = 5";
//     const [test_rows] = await db.query(test_sql);
//     // const [reigistered_rows] = await db.query(reigistered);
//     // console.log({registered_rows});
//     res.json({test_rows});
// })
// router.get('/event-test/seminar', async(req, res, next)=>{
//     const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 3;";
//     const [test_rows] = await db.query(test_sql);
//     res.json({test_rows});
// })
// router.get('/event-test/vr', async(req, res, next)=>{
//     const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 4;";
//     const [test_rows] = await db.query(test_sql);
//     res.json({test_rows});
// })
// router.get('/event-test/theater', async(req, res, next)=>{
//     const test_sql = "SELECT * FROM `event_all` JOIN `event_style` ON `event_all`.`style` = `event_style`.`sid` WHERE `cate` = 5;";
//     const [test_rows] = await db.query(test_sql);
//     res.json({test_rows});
// })

module.exports = router;