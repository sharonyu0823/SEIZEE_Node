const express = require('express');
const router = express.Router();
const db = require(__dirname+"/../modules/db_connect");
const cors = require("cors");


router.get('/inner_cook', async(req,res)=>{
    const cookPost = "SELECT * FROM `cooking_post`";
    const [cookInnerRows] = await db.query(cookPost);
    const cookInner = "SELECT *  FROM `instructions`";
    const [inst] = await db.query(cookInner);

    cookInnerRows.forEach(p=>{
        inst.forEach(i=>{
            if(i.cooking_post_sid===p.sid){
                p.instructions ||= [];
                p.instructions.push(i)
            }
        })
    })
    res.json({cookInnerRows});
})

router.get('/cook/:sid', async(req,res)=>{
    const {sid} = req.params
    const cookPost = `SELECT * FROM cooking_post WHERE sid = ${sid}`;
    const [cookInnerRows] = await db.query(cookPost);
    const cookInner = "SELECT *  FROM `instructions`";
    const [inst] = await db.query(cookInner);

    cookInnerRows.forEach(p=>{
        inst.forEach(i=>{
            if(i.cooking_post_sid===p.sid){
                p.instructions ||= [];
                p.instructions.push(i)
            }
        })
    })
    res.json({cookInnerRows});
})








router.get('/post_cook', async(req,res)=>{
    const cookPost = "SELECT * FROM `cooking_post`";
    const [cookPostRows] = await db.query(cookPost);
    res.json({cookPostRows});
})

router.get('/comment_cook', async(req,res)=>{
    const commentCook = "SELECT * FROM `comment` JOIN `categories` ON `comment`.`categories_sid` = `categories`.`sid` WHERE `categories_sid` =4 AND `post_sid` =1;"
    const [commentRows] = await db.query(commentCook);
    res.json({commentRows});
})

module.exports = router;