var express = require('express');
var router = express.Router();
const db = require(__dirname + "/modules/db_connect");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* product page. */
app.use("/product_list", require(__dirname + "/routes/product"));


module.exports = router;
