const express = require('express');
const router = express.Router();
const db = require(__dirname+"/../modules/db_connect");
const cors = require("cors");
const fileUpload = require('express-fileupload');
const _ = require('lodash');
const { includes } = require('lodash');
const upload = require(__dirname+"/../modules/02_upload_img")
const path = require('path');
const fs = require('fs')
const sqlString =require ("sqlString")


// router.get('/inner_cook', async(req,res)=>{
//     const cookPost = "SELECT * FROM `forum_cooking_post`";
//     const [cookInnerRows] = await db.query(cookPost);
//     const cookInst = "SELECT *  FROM `forum_instructions`";
//     const [inst] = await db.query(cookInst);

//     cookInnerRows.forEach(p=>{
//         inst.forEach(i=>{
//             if(i.cooking_post_sid===p.sid){
//                 p.instructions ||= [];
//                 p.instructions.push(i)
//             }
//         })
//     })
//     res.json({cookInnerRows});
// })

router.get('/cook/inner/:sid', async(req,res)=>{
    const {sid} = req.params;
    const cookPost = "SELECT `forum_cooking_post`.* ,`member`.`mb_photo`, `member`.`mb_name` , `member`.`mb_email` FROM `forum_cooking_post` JOIN `member` ON `forum_cooking_post`.`member_sid` = `member`.`mb_sid` WHERE sid=?";
    const [cookInnerRows] = await db.query(cookPost, [sid]);
    if(! cookInnerRows.length){
        return res.json({ success: false});
    }
    const cookRows = cookInnerRows[0];
    const cookInner = "SELECT *  FROM `forum_instructions` WHERE cooking_post_sid=?";
    const [inst] = await db.query(cookInner, [sid]);

    const step = `SELECT * FROM forum_step WHERE cooking_post_sid=?`
    const [stepRows] = await db.query(step, [sid]);
    const comment = `SELECT forum_comment.* , member.mb_photo , member.mb_name , member.mb_email FROM forum_comment JOIN member ON forum_comment.member_sid = member.mb_sid WHERE categories_sid=4 AND post_sid=?;`
    const [commentRows] = await db.query(comment, [sid]);

    cookRows.instructions = inst;
    cookRows.steps = stepRows;
    cookRows.comment = commentRows;
    res.json(cookRows);
})


router.get('/official/inner/:sid', async(req,res)=>{
    const {sid} = req.params;
    const officialPost = `SELECT * FROM forum_official_post WHERE sid=?`;
    const [officialInnerRows] = await db.query(officialPost, [sid]);
    if(! officialInnerRows.length){
        return res.json({ success: false});
    }
    const officialRows = officialInnerRows[0];
    const comment = `SELECT * FROM forum_comment WHERE categories_sid=1 AND post_sid=?;`
    const [commentRows] = await db.query(comment, [sid]);
    officialRows.comment = commentRows;
    res.json(officialRows);
})

router.get('/store/inner/:sid', async(req,res)=>{
    const {sid} = req.params;
    const storePost = "SELECT sp.*,`shop_list`.`shop_name` mb_name ,`shop_list`.`shop_phone` mb_email FROM `forum_store_post` sp JOIN `shop_list` ON sp.`store_sid` = `shop_list`.`sid` WHERE sp.`sid`=?";

    // const storePost = "SELECT `forum_store_post`.*,`shop_list`.`shop_name` FROM `forum_store_post` JOIN `shop_list` ON `forum_store_post`.`store_sid`= `shop_list`.`sid` WHERE `forum_store_post`.`sid`=?";
    const [storeInnerRows] = await db.query(storePost,[sid]);
    if(! storeInnerRows.length){
        return res.json({ success: false}); 
    }
    const storeRows = storeInnerRows[0];
    const comment = `SELECT * FROM forum_comment  WHERE categories_sid=2 AND post_sid=?;`
    const [commentRows] = await db.query(comment, [sid]);
    storeRows.comment = commentRows;
    res.json(storeRows);
})
router.get('/share/inner/:sid', async(req,res)=>{
    const {sid} = req.params;
    const sharePost = "SELECT `forum_share_post`.* ,`member`.`mb_photo`, `member`.`mb_name`,`member`.`mb_email` FROM `forum_share_post` JOIN `member` ON `forum_share_post`.`member_sid` = `member`.`mb_sid` WHERE sid=?";
    const [shareInnerRows] = await db.query(sharePost,[sid]);
    if(! shareInnerRows.length){
        return res.json({ success: false}); 
    }
    const shareRows = shareInnerRows[0];
    const comment = `SELECT * FROM forum_comment WHERE categories_sid=3 AND post_sid=?;`
    const [commentRows] = await db.query(comment, [sid]);
    shareRows.comment = commentRows;
    res.json(shareRows);
})
//http://localhost:3002/forum/post_cook?likes[]=%E7%89%9B%E8%82%89&likes[]=%E9%A6%99%E8%8F%87
//篩選食材
router.get('/post_cook', async(req,res)=>{
    const likesOp = req.query.likesOp;
    const servingOp = req.query.servingOp;
    const timeOp = req.query.timeOp;
    // let cookPost = "SELECT * FROM `forum_cooking_post`";
    let cookPost;

    let $where = ' WHERE 1 ';

    if(likesOp && likesOp.length){
        $where += " AND ins.instrucContent IN ('" + likesOp.join("','")+ "') ";
    }
    if(servingOp && servingOp.length){
        $where += " AND cp.serving IN('" + servingOp.join("','")+ "') ";
    }
    if(timeOp && timeOp.length){
        $where += " AND cp.times IN ('" + timeOp.join("','")+ "') ";
    }
    cookPost = `SELECT cp.* ,member.mb_photo, member.mb_name,member.mb_email FROM forum_cooking_post cp JOIN member ON cp.member_sid = member.mb_sid JOIN forum_instructions ins ON cp.sid=ins.cooking_post_sid ${$where} GROUP BY cp.sid `;

    //console.log({cookPost})
/*
    if(likesOp && likesOp.length){
        cookPost = "SELECT cp.* FROM `forum_cooking_post` cp JOIN forum_instructions ins ON cp.sid=ins.cooking_post_sid WHERE ins.instrucContent IN ('" + likesOp.join("','")+ "') AND cp.serving IN('" + servingOp.join("','")+ "') GROUP BY cp.sid AND cp.times IN ('" + timeOp.join("','")+ "') ";
    }
*/
    const [cookPostRows] = await db.query(cookPost);
    const cookInst = "SELECT *  FROM `forum_instructions`";
    const [inst] = await db.query(cookInst);

    cookPostRows.forEach(p=>{
        inst.forEach(i=>{
            if(i.cooking_post_sid===p.sid){
                p.instructions ||= [];
                p.instructions.push(i)
            }
        })
    })
    
    res.json({cookPostRows});
})
router.get('/post_official', async(req,res)=>{
    const officialPost = "SELECT * FROM `forum_official_post`";
    const [officialPostRows] = await db.query(officialPost);
    const forumHashtag = "SELECT * FROM `forum_hashtag` WHERE `categories_sid`=1";
    const [forumHashtagRows] = await db.query(forumHashtag);

    officialPostRows.forEach(p=>{
        forumHashtagRows.forEach(i=>{
                    if(i.post_sid===p.sid){
                        p.tag ||= [];
                        p.tag.push(i)
                    }
                })
            })
    
    res.json({officialPostRows});
})
router.get('/post_store', async(req,res)=>{
    const storePost = "SELECT sp.*,`shop_list`.`shop_name` mb_name ,`shop_list`.`shop_phone`  FROM `forum_store_post` sp JOIN `shop_list` ON sp.`store_sid` = `shop_list`.`sid` ";
    const [storePostRows] = await db.query(storePost);
    res.json({storePostRows});
})
router.get('/post_share', async(req,res)=>{
    const sharePost = "SELECT shp.* ,member.mb_photo, member.mb_name,member.mb_email FROM `forum_share_post` shp JOIN member ON shp.member_sid = member.mb_sid ";
    const [sharePostRows] = await db.query(sharePost);

    res.json({sharePostRows});
})
router.get('/all_post', async(req,res)=>{
    const officialPost = "SELECT * FROM `forum_official_post`";
    const [officialPostRows] = await db.query(officialPost);
    const sharePost = "SELECT `forum_share_post`.*, `member`.`mb_photo`, `member`.`mb_name`,`member`.`mb_email` FROM `forum_share_post` JOIN `member` ON `forum_share_post`.`member_sid` = `member`.`mb_sid` ";
    const [sharePostRows] = await db.query(sharePost);
    const storePost = "SELECT `forum_store_post`.*,`shop_list`.`shop_name` mb_name FROM `forum_store_post` JOIN `shop_list` ON `forum_store_post`.`store_sid` = `shop_list`.`sid` ";
    const [storePostRows] = await db.query(storePost);
    const cookPost = "SELECT `forum_cooking_post`.* , `member`.`mb_photo`, `member`.`mb_name`,`member`.`mb_email` FROM `forum_cooking_post` JOIN `member` ON `forum_cooking_post`.`member_sid` = `member`.`mb_sid` ";
    const [cookPostRows] = await db.query(cookPost);

    const allPostRows = [
        ...officialPostRows,
        ...sharePostRows,
        ...storePostRows,
        ...cookPostRows,
    ]
    res.json(allPostRows);
})

// router.get('/hashTag', async(req,res)=>{
//     const forumHashtag = "SELECT * FROM `forum_hashtag`";
//     const [forumHashtagRows] = await db.query(forumHashtag);
    
//     res.json({forumHashtagRows});
// })
//我的發文
router.get('/myPost',async(req,res)=>{
    const mid = req.query.mid ? +req.query.mid : 0;
    const myCookPost = "SELECT `forum_cooking_post`.* ,`member`.`mb_photo`, `member`.`mb_name` , `member`.`mb_email` FROM `forum_cooking_post` JOIN `member` ON `forum_cooking_post`.`member_sid` = `member`.`mb_sid` WHERE member_sid=?";
    const [myCookPostRows] = await db.query(myCookPost, [mid]);
    res.json(myCookPostRows);
})

//收藏
router.get('/forum_toggle', async (req,res) => {
    const mid = req.query.mid ? +req.query.mid : 0;
    const cid = req.query.cid ? +req.query.cid : 0;
    const pid = req.query.pid ? +req.query.pid : 0;

    if(!mid || !cid || !pid) return res.json({success: false});

    // `mb_sid`, `categories_sid`, `post_sid`

    let sql = `SELECT * FROM forum_liked WHERE mb_sid=? AND categories_sid=? AND post_sid=?`;
    const [rows] = await db.query(sql, [mid, cid, pid]);
    if(rows.length){
        // had
        let sql_del = `DELETE FROM forum_liked WHERE mb_sid=? AND categories_sid=? AND post_sid=? `;
        await db.query(sql_del, [mid, cid, pid]);
        res.json({success: true, mid, cid, pid, msg:'delete'});
    } else {
        
        let sql_insert = `INSERT INTO forum_liked(mb_sid, categories_sid, post_sid, created_at) VALUES (?,?,?, NOW())`;
        await db.query(sql_insert, [mid, cid, pid]);
        res.json({success: true, mid, cid, pid, msg:'insert'});
    }

})

router.get('/forum_likes', async (req,res) => {
    const mid = req.query.mid ? +req.query.mid : 0;

    if(!mid ) return res.json({success: false , message:'請先登入'});

    // `mb_sid`, `categories_sid`, `post_sid`

    let likesSql = `SELECT forum_liked.* ,forum_cooking_post.title,forum_cooking_post.img FROM forum_liked JOIN forum_cooking_post ON forum_liked.post_sid = forum_cooking_post.sid WHERE mb_sid=? `;
    const [rows] = await db.query(likesSql, [mid]);

    res.json({success: true, rows});
    

})

//上傳留言
router.post('/message',upload.none() ,async(req,res)=>{
    const output = {
        success: false,
        code: 0,
        error: {},
        postData: req.body, // 除錯用
      };
    const messSql =  'INSERT INTO `forum_comment`(`member_sid`, `categories_sid`, `post_sid`, `content`, `parent_sid`, `created_at`) VALUES (?,?,?,?,0,NOW())';
   console.log("req.body",req.body);

    const [result] = await db.query(messSql,[
    req.body.member_sid,
    req.body.categories_sid,
    req.body.post_sid,
    req.body.content, 

   ]) 
   if (result.affectedRows) output.success = true;
   res.json(output);
})


//發文路由
router.post('/writeForm',upload.none(),async(req,res)=>{

    let r = Math.floor(Math.random()*25)+1;
    if(r.toString().length==1){
        r = '0' + r + 'food.png';
    } else{
        r = r + 'food.png';
    }
    let data = req.body;

    //console.log('data')
    //console.log(data)
    console.log('data.img')
    console.log(data.img)
    const output = {
        success: false,
        code: 0,
        error: {},
        postData: req.body,
    }
    const writeSql = 'INSERT INTO `forum_cooking_post`( `member_sid`, `categories_sid`, `title`, `img`, `icon`, `induction`, `serving`, `times`, `Ps`, `creat_at`) VALUES (?,4,?,?,?,?,?,?,?,NOW())';
    const instrSql = 'INSERT INTO `forum_instructions`( `cooking_post_sid`, `instrucContent`, `portion`) VALUES (?,?,?)';
    const stepSql = 'INSERT INTO `forum_step`( `cooking_post_sid`, `step`, `stepImg`, `stepContent`) VALUES (?,?,?,?)'
    const [resultWr] = await db.query(writeSql,[
        data.member_sid,
        data.title,
        data.img,
        r,
        data.induction, 
        data.serving,         
        data.times, 
        data.ps, 
       ]) 
       
       
       for (let i = 0; i < data.instructions.length; i++) {
        const resultIns = await db.query(instrSql,[
            resultWr.insertId,
            data.instructions[i].instrucContent, 
            data.instructions[i].portion, 
           ]) 
           if (resultIns.affectedRows) output.success = true;
      }
    //   console.log(resultIns);
    // const [resultIns] = await db.query(instrSql,[
    //     resultWr.insertId,
    //     data.instructions.instrucContent, 
    //     data.portion, 
    //    ]) 
    for (let i = 0; i < data.steps.length; i++){
        const resultSt = await db.query(stepSql,[
        resultWr.insertId,
        data.steps[i].step, 
        data.steps[i].stepImg, 
        data.steps[i].stepContent,
       ]) 
       if (resultSt.affectedRows) output.success = true;
    }
    
       if (resultWr.affectedRows) output.success = true;       
       res.json(output);
   

})


//TODO:  move to util
function _uuid() {
    var d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
      d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

//  圖檔上傳
router.post('/upload',upload.single('file'),async(req,res)=>{
    console.log('req.file')
    console.log(req.file)
    let file = req.file;
    const newFileName = _uuid() + path.extname(file.filename)
    const newPath = __dirname + "/../public/images/02-forum/cook/" + newFileName
    console.log(`older path: ${file.path}`)
    console.log(`new path: ${newPath}`)

    //move photo to uploads directory
    fs.rename(file.path, newPath, ()=> { })
    //push file details
    const respData = {
        name: file.name,
        newFileName: newFileName,
        mimetype: file.mimetype,
        size: file.size
    };
    res.json(respData);
})

//取得店家照片
// router.get('/store_photo', async(req,res)=>{
//     const storePhoto = "SELECT `shop_cover` FROM `shop_list`";
//     const [storePhotoRows] = await db.query(storePhoto);
//     res.json({storePhotoRows});
// })


module.exports = router;