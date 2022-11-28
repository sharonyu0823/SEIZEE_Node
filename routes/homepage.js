const express = require("express");
const router = express.Router();
const db = require(__dirname + '/../modules/db_connect');
const cors = require("cors");
//const { application } = require("express");

router.get('/news-crawl', async(req, res) => {
    const recipeNews = "SELECT * FROM `cooking_post` JOIN `member` ON `cooking_post`.`member_sid` = `member`.`mb_sid` ORDER BY `sid` DESC LIMIT 1";
    const [recipeNewsRow] = await db.query(recipeNews);
    
    const eventNews = "SELECT * FROM `event_all` ORDER BY `sid` DESC LIMIT 1";
    const [eventNewsRow] = await db.query(eventNews);

    const seizeeNews = "SELECT * FROM `official_post` ORDER BY `sid` LIMIT 1";
    const [seizeeNewsRow] = await db.query(seizeeNews);

    const newsCrawlRows = {
        'recipeNewsRow': recipeNewsRow[0],
        'eventNewsRow': eventNewsRow[0],
        'seizeeNewsRow': seizeeNewsRow[0],
    };

    res.json(newsCrawlRows);
})

router.get('/recipe-posts', async(req, res) => {
    const recipePost = "SELECT * FROM `cooking_post` JOIN `member` ON `cooking_post`.`member_sid` = `member`.`mb_sid` ORDER BY `sid`";
    const [recipePostRows] = await db.query(recipePost);
    
    res.json({recipePostRows});
})

router.get('/shop-posts', async(req, res) => {
    const shopPost = "SELECT * FROM `share_post` JOIN `member` ON `share_post`.`member_sid` = `member`.`mb_sid` ORDER BY `sid` DESC";
    const [shopPostRows] = await db.query(shopPost);
    
    res.json({shopPostRows});
})


router.get('/official-posts', async(req, res) => {
    const officialPost = "SELECT * FROM `official_post` ORDER BY `sid` DESC";
    const [officialPostRows] = await db.query(officialPost);
    
    res.json({officialPostRows});
})

module.exports = router