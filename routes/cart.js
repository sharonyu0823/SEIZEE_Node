const express = require("express");
const router = express.Router();
const db = require(__dirname + '/../modules/db_connect');
const cors = require("cors");

const axios = require('axios');
const { HmacSHA256 } = require('crypto-js');
const Base64 = require('crypto-js/enc-base64');
const dayjs = require('dayjs');

const { 
    LINEPAY_CHANNEL_ID, 
    LINEPAY_CHANNEL_SECRET_KEY, 
    LINEPAY_VERSION,
    LINEPAY_SITE, 
    LINEPAY_RETURN_HOST, 
    LINEPAY_RETURN_CONFIRM_URL,LINEPAY_RETURN_CANCEL_URL 
} = process.env;

const sampleData = require('../sample/sampleData');
// console.log(sampleData);
const orders = { }


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

// CartItem - 用product_sid帶出其他產品資料
router.get('/prod/:prodsid', async (req, res) => {
    const prodsid = req.params.prodsid;
    const prod_info_sql = `SELECT * FROM food_product 
    JOIN product_inventory ON food_product.sid = product_inventory.food_product_sid 
    JOIN product_picture ON food_product.sid = product_picture.food_product_sid
    WHERE food_product.sid = ${prodsid}`;
    const [prod_info_rows] = await db.query(prod_info_sql, [

    ])
    const row = {...prod_info_rows};

    if(row[0]) {
        res.json({prod_info_rows});
    } else {
        res.send('找不到該產品sid對應的資料');
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
router.get('/rec-merch/:shopsid', async (req, res) => {
    const shopsid = req.params.shopsid;
    const rec_merch_sql = `SELECT * FROM food_product 
    JOIN product_inventory ON food_product.sid = product_inventory.food_product_sid 
    JOIN product_picture ON food_product.sid = product_picture.food_product_sid
    WHERE shop_list_sid = ${shopsid} 
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
router.get('/add-save/', async (req, res) => {
    // const mbsid = req.params.mbsid
    const mbsid = req.query.mbsid? +req.query.mbsid: 0;
    const prodsid = req.query.prodsid? +req.query.prodsid: 0;

    console.log(mbsid, prodsid); 

    if(!mbsid || !prodsid) return res.json({success: false});

    const check_save_sql = `SELECT * FROM product_collection WHERE food_product_sid = ? AND mb_sid = ?`;
    const [check_save_rows]  = await db.query(check_save_sql, [prodsid, mbsid]);
    // const row = {...check_save_rows};
    // res.json(row);

    if(check_save_rows.length) {
        res.json({success: true, msg:'已在收藏列表當中'});
    } else {
        const add_save_sql = `
        INSERT INTO product_collection(food_product_sid, mb_sid) VALUES (?,?)`;
        const [add_save_rows] = await db.query(add_save_sql, [prodsid, mbsid]);
        res.json({success: true, msg:'成功加入收藏列表'});
    }
})

// CartDone - 將付款成功的訂單寫入資料庫
// 歷史訂單+訂單明細+會員sid+商品列表
// 同時修改庫存表裡面的數字
router.post('/add-order/:ordernum', async (req, res) => {
    const ordernum = req.params.ordernum
    const mb_sid = 256
    // console.log(ordernum, req.body)
    try {
        const add_order_history_sql = `INSERT INTO order_history (order_num, created_at, shop_sid, origin_total, total, mb_sid) VALUES (?, NOW(), ?, ?, ?, ?)`;
        const [add_order_history_row] = await db.query(add_order_history_sql, [
            req.params.ordernum,
            req.body.userCart[0].shop_sid,
            req.body.totalUnitPrice,
            req.body.totalSalePrice,
            mb_sid
        ]);

        
        for(let i =0; i<req.body.userCart.length;i++){
            const add_order_details_sql = `INSERT INTO order_details (order_num, created_at, product_sid, product_name, quantity, origin_price, total_price) VALUES (?, NOW(), ?, ?, ?, ?, ?)`;
            const [add_order_details_rows] = await db.query(add_order_details_sql,[
                req.params.ordernum,
                req.body.userCart[i].prod_sid,
                req.body.userCart[i].name,
                req.body.userCart[i].amount,
                (req.body.userCart[i].unit_price * req.body.userCart[i].amount),
                (req.body.userCart[i].sale_price * req.body.userCart[i].amount),
            ])

            const update_inventory_sql = `UPDATE product_inventory SET inventory_qty = (?) WHERE food_product_sid = (?)`;
            const [update_inventory_rows] = await db.query(update_inventory_sql, [
                (req.body.userCart[i].inventory - req.body.userCart[i].amount),
                req.body.userCart[i].prod_sid,
            ])

        } 

        res.send('訂單成功寫入資料庫，成功更新顧存數量')
    }
    catch (error) {
        res.send(error.message)
    }
})


// CartDone - 訂單成功頁面帶出該筆訂單明細
// 歷史訂單+訂單明細+會員sid+商品列表
router.get('/payment-done/:mbsid', async (req, res) => {
    const mbsid = req.params.mbsid

    const this_order_details_sql = `SELECT * FROM order_history 
    JOIN order_details ON order_history.order_num = order_details.order_num 
    JOIN order_status ON order_history.order_status_sid = order_status.sid 
    JOIN order_payment ON order_history.order_payment_sid = order_payment.sid 
    WHERE order_history.mb_sid = 2 
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

// LINE Pay 部分
router
.get('/', (req, res) => {
    res.render('index', { title: 'Express' });
})
// 前端頁面
.get('/checkout/:id', (req, res) => {
    const { id } = req.params;
    const order = JSON.parse(JSON.stringify(sampleOrders[id]));
    order.id = dayjs(new Date()).format('YYYYMMDDHHmmss');
    orders[order.id] = order;

    res.render('checkout', { order });
})
.get('/success/:id', (req, res) => {
    const { id } = req.params;
    const order = orders[id];

    res.render('success', { order });
})


// 跟 LINE PAY 串接的 API
router.post('/linePay/:orderId', async (req, res) => {
    const {orderNo } = req.params;
    const order = orders[orderNo];
    // console.log('create-order', order);
  
    try {
      // 建立 LINE Pay 請求規定的資料格式
      const linePayBody = createLinePayBody(order)

      // CreateSignature 建立加密內容
      const uri = '/payments/request';
      const headers = createSignature(uri, linePayBody);
    
      // 準備送給 LINE Pay 的資訊
      console.log(linePayBody, signature);

      // API 位址
      const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
    
      // const linePayRes = await axios.post(url, linePayBody, { headers });
      // console.log(linePayRes.data.info);

      if(linePayRes?.data?.returnCode === '0000') {
        res.redirect(linePayRes?.data?.info.paymentUrl.web);
      } else {
        res.status(400).send({
          message: '訂單不存在',
          });
        }
    }
    catch(error) {
      // 各種運行錯誤的狀態：可進行任何的錯誤處理
      console.log(error.message);
      res.end();
    }
  })

// 本地端頁面
.get('/linePay/confirm', async (req, res) => {
    const {transactionId, orderId} = req.query;
    const order = orders[orderId];

    try {
    // 建立 LINE Pay 請求規定的資料格式
    const uri = `/payments/${transactionId}/confirm`
    const linePayBody = {
      amount: order.amount, 
      currency: 'TWD'
    };
    
    // CreateSignature 建立加密內容
    const headers = createSignature(uri, linePayBody);

    // API 位址
    const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
    const linePayRes = await axios.post(url, linePayBody, { headers });
    console.log(linePayRes);

    // 請求成功...
    if (linePayRes?.data?.returnCode === '0000') {
        res.redirect(`/success/${orderId}`)
      } else {
        res.status(400).send({
          message: linePayRes,
        });
      }
  
    } catch(error) {
      console.log(error.message);
    }
  
    res.end();
  })
  
function createLinePayBody(order) {
    return {
        ...order,
        currency: 'TWD',
        redirectUrls: {
            confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
            cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
          },
    }
}

function createSignature(uri, linePayBody) {
    const nonce = parseInt(new Date().getTime() / 1000);

    const encrypt = HmacSHA256(`${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linePayBody)}${nonce}`, LINEPAY_CHANNEL_SECRET_KEY)

    const signature = Base64.stringify(encrypt);
    // console.log(signature);
    
    const headers = {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature,
    };
    return { headers };
}

module.exports = router;

// 範例參考連結
// https://github.com/Wcc723/linePaySample 