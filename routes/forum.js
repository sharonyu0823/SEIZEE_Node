const express = require('express');
const router = express.Router();
const db = require(__dirname+"/../modules/db_connect");
const cors = require("cors");
const fileUpload = require('express-fileupload');
const _ = require('lodash');
const { includes } = require('lodash');
const upload = require(__dirname+"/../modules/02_upload_img")

const app = express();

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
    const cookPost = `SELECT * FROM forum_cooking_post WHERE sid=?`;
    const [cookInnerRows] = await db.query(cookPost, [sid]);
    if(! cookInnerRows.length){
        return res.json({ success: false});
    }
    const cookRows = cookInnerRows[0];
    const cookInner = "SELECT *  FROM `forum_instructions` WHERE cooking_post_sid=?";
    const [inst] = await db.query(cookInner, [sid]);

    const step = `SELECT * FROM forum_step WHERE cooking_post_sid=?`
    const [stepRows] = await db.query(step, [sid]);
    const comment = `SELECT * FROM forum_comment WHERE categories_sid=4 AND post_sid=?;`
    const [commentRows] = await db.query(comment, [sid]);

    cookRows.instructions = inst;
    cookRows.steps = stepRows;
    cookRows.comment = commentRows;

    /*
    cookInnerRows.forEach(p=>{
        inst.forEach(i=>{
            if(i.cooking_post_sid===p.sid){
                p.instructions ||= [];
                p.instructions.push(i)
            }
        })
    })
    */
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
    const storePost = `SELECT * FROM forum_store_post WHERE sid=?`;
    const [storeInnerRows] = await db.query(storePost,[sid]);
    if(! storeInnerRows.length){
        return res.json({ success: false}); 
    }
    const storeRows = storeInnerRows[0];
    const comment = `SELECT * FROM forum_comment WHERE categories_sid=2 AND post_sid=?;`
    const [commentRows] = await db.query(comment, [sid]);
    storeRows.comment = commentRows;
    res.json(storeRows);
})
router.get('/share/inner/:sid', async(req,res)=>{
    const {sid} = req.params;
    const sharePost = `SELECT * FROM forum_share_post WHERE sid=?`;
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
    const likes = req.query.likes;
    console.log({likes});
    let cookPost = "SELECT * FROM `forum_cooking_post`";
    if(likes && likes.length){
        cookPost = "SELECT cp.* FROM `forum_cooking_post` cp JOIN forum_instructions ins ON cp.sid=ins.cooking_post_sid WHERE ins.instrucContent IN ('" + likes.join("','")+ "')";
    }
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
    res.json({officialPostRows});
})
router.get('/post_store', async(req,res)=>{
    const storePost = "SELECT * FROM `forum_store_post`";
    const [storePostRows] = await db.query(storePost);
    res.json({storePostRows});
})
router.get('/post_share', async(req,res)=>{
    const sharePost = "SELECT * FROM `forum_share_post`";
    const [sharePostRows] = await db.query(sharePost);
    res.json({sharePostRows});
})
router.get('/all_post', async(req,res)=>{
    const officialPost = "SELECT * FROM `forum_official_post`";
    const [officialPostRows] = await db.query(officialPost);
    const sharePost = "SELECT * FROM `forum_share_post`";
    const [sharePostRows] = await db.query(sharePost);
    const storePost = "SELECT * FROM `forum_store_post`";
    const [storePostRows] = await db.query(storePost);
    const cookPost = "SELECT * FROM `forum_cooking_post` ";
    const [cookPostRows] = await db.query(cookPost);

    const allPostRows = [
        ...officialPostRows,
        ...sharePostRows,
        ...storePostRows,
        ...cookPostRows,
    ]
    res.json(allPostRows);
})
router.post('/message',upload.none() ,async(req,res)=>{
    const output = {
        success: false,
        code: 0,
        error: {},
        postData: req.body, // 除錯用
      };
    const messSql =  'INSERT INTO `forum_comment`(`member_sid`, `categories_sid`, `post_sid`, `content`, `parent_sid`, `created_at`) VALUES (1,4,1,?,0,NOW())';
   
    const [result] = await db.query(messSql,[
    req.body.content,
   ]) 
   if (result.affectedRows) output.success = true;
   res.json(output);
})


//----圖檔上傳
app.use(fileUpload({
    createParentPath: true
}));
app.use('/uploads', express.static('uploads'));
app.post('/upload-photos', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let photoDtat=[]
            
           //loop all files
          _.forEach(_.keysIn(req.files.photos), (key) => {
            let photo = req.files.photos[key];
            
            //move photo to uploads directory
            photo.mv('./uploads/' + photo.name);

            //push file details
            photoDtat.push({
                name: photo.name,
                mimetype: photo.mimetype,
                size: photo.size
            });
        });

        //return response
        res.json({
            status: true,
            message: 'Files are uploaded',
            data: data
        });
    }
} catch (err) {
    res.status(500).json(err);
}
});




module.exports = router;