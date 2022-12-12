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
    // console.log('test:', signature);
    
    const headers = {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature,
    };
    return headers;
}

// 測試用

router.get('/test123', async (req, res) => {
    // const test_sql = "SELECT * FROM `order_history` JOIN `order_details` ON `order_history`.`order_num`=`order_details`.`order_num` WHERE 1";
    // const [test_rows] = await db.query(test_sql);
    // res.json({test_rows});
    const get_sid_qty_sql = `SELECT * FROM order_details JOIN order_history ON order_details.order_num = order_history.order_num JOIN product_inventory ON product_inventory.food_product_sid = order_details.product_sid WHERE order_details.order_num = 20221208210626`;
    const [get_sid_qty_rows] = await db.query(get_sid_qty_sql);
    // res.json(get_sid_qty_rows);
})

// 測試2，帶會員資料
router.get('/info/:mid', async (req, res) => {
    const mid = req.params.mid;
    // console.log(mid);
    const member_info_sql = `SELECT * FROM member WHERE mb_sid = ${mid}`;
    const [member_info_rows]  = await db.query(member_info_sql);
    const row = {...member_info_rows}
    console.log(row);

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
    LEFT JOIN product_picture ON product_picture.sid =( SELECT product_picture.sid FROM product_picture  WHERE food_product_sid= food_product.sid ORDER BY product_picture.sid 
    LIMIT 1 ) 
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

    // console.log(mbsid, prodsid); 

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

// CartInfo - Line Pay 按下付款後
// 將訂單寫入訂單/明細(狀態：未付款)，先不修改庫存表裡面的數字
router.post('/linePay/', async (req, res) => {
    const mb_sid = req.query.mid
    const ordernum = req.query.ordernum
    // const ordernum = dayjs(new Date()).format('YYYYMMDDHHmmss')
    // console.log(ordernum, req.body)

    // 將訂單寫入訂單/明細(狀態：未付款)
    try {
        const add_order_history_sql = `INSERT INTO order_history (order_num, created_at, shop_sid, origin_total, total, mb_sid, order_status_sid, order_patment_sid) VALUES (?, NOW(), ?, ?, ?, ?, ?,?)`;
        const [add_order_history_row] = await db.query(add_order_history_sql, [
            ordernum,
            req.body.userCart[0].shop_sid,
            req.body.totalUnitPrice,
            req.body.totalSalePrice,
            mb_sid,
            5,
            2
        ]);
        
        for(let i =0; i<req.body.userCart.length;i++){
            const add_order_details_sql = `INSERT INTO order_details (order_num, created_at, product_sid, product_name, quantity, origin_price, total_price) VALUES (?, NOW(), ?, ?, ?, ?, ?)`;
            const [add_order_details_rows] = await db.query(add_order_details_sql,[
                ordernum,
                req.body.userCart[i].prod_sid,
                req.body.userCart[i].name,
                req.body.userCart[i].amount,
                (req.body.userCart[i].unit_price * req.body.userCart[i].amount),
                (req.body.userCart[i].sale_price * req.body.userCart[i].amount),
            ])
            
        } 

        console.log('訂單成功寫入資料庫，成功更新庫存數量')
    }
    catch (error) {
        console.log(error.message)
    }

    // 將商品資料整理成line pay格式
    const items = req.body.userCart.map(i=>{
        const {amount, name, prod_sid, sale_price, unit_price} = i;
        return {
            id: prod_sid,
            name,
            quantity: amount,
            price: sale_price,
            originalPrice: unit_price,
        }
    })

    const order = {
        orderId: ordernum,
        amount: req.body.totalSalePrice,

        packages:[
            {
                id: '1',
                amount: req.body.totalSalePrice,
                products: items
            }
        ],
        
    }
    orders[order.orderId] = order;
    console.log('orders: ', orders);
    // console.log('create-order', order);

    try {
    const linePayBody = createLinePayBody(order);
        console.log('body111111',linePayBody)
    const uri = '/payments/request';
    const headers = createSignature(uri, linePayBody);

    const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
    const linePayRes = await axios.post(url, linePayBody, {headers });
    // console.log(headers);
    // console.log(linePayRes.data.info);
    // console.log({linePayBody})
    // console.log(JSON.stringify(linePayBody, null, 4))
    // console.log(linePayRes);
console.log(linePayRes)
    if(linePayRes?.data?.returnCode === '0000') {
        res.json({
            success: true,
            url: linePayRes?.data?.info.paymentUrl.web
        });
    } else {
        res.json({
            success: false,
            message: '訂單不存在',
        });
    }

    }
    catch(error) {
        console.log(error.message);
    }

})

// 使用者付款後
// 付款成功 - 更新狀態+庫存；付款失敗 - 更新狀態
router.get('/linePay/confirm', async (req, res) => {
    const {transactionId, orderId, mid} = req.query;
    console.log(`transactionId: ${transactionId}, orderId: ${orderId}, mid: ${mid}`);
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
        // 修改庫存+訂單的付款狀態改為「1 已付款」
        try {
            // 查詢ordernum // 20221208210626
            const get_ordernum_sql = `SELECT * FROM order_history ORDER BY created_at DESC LIMIT 1`;
            const [get_ordernum_row] = await db.query(get_ordernum_sql)
            const ordernum = get_ordernum_row[0].order_num;

            // 更新訂單付款狀態 
            const update_order_status_sql = `UPDATE order_history SET order_status_sid = 1 WHERE order_num = ${ordernum}`;
            const [update_order_status_rows] = await db.query(update_order_status_sql);
            console.log('付款狀態已更新');

            // JOIN 訂單明細找到要修改的商品&數量
            const get_sid_qty_sql = `SELECT * FROM order_details JOIN order_history ON order_details.order_num = order_history.order_num WHERE order_details.order_num = ${ordernum}`;
            const [get_sid_qty_rows] = await db.query(get_sid_qty_sql);

            // 更新庫存
            for(let i = 0; i< get_sid_qty_rows.length; i++) {
                const update_inventory_sql = `UPDATE product_inventory SET inventory_qty = ? WHERE food_product_sid = ?`;
                const [update_inventory_rows] = await db.query(update_inventory_sql, [
                (get_sid_qty_rows[i].inventory_qty - get_sid_qty_rows[i].quantity),
                get_sid_qty_rows[i].product_sid,
                ])
            }
            console.log('商品庫存已更新');
        }
        catch(error) {
            console.log(error.message)
        }
        console.log('請求成功')
        res.json({
            success: true,
            url: `/success/${orderId}`,
        });
    } else {
        // 訂單的付款狀態改為「付款失敗」

        // 查詢ordernum // 20221208210626
        const get_ordernum_sql = `SELECT * FROM order_history ORDER BY created_at DESC LIMIT 1`;
        const [get_ordernum_row] = await db.query(get_ordernum_sql)
        const ordernum = get_ordernum_row[0].order_num;

        // 將付款狀態改為「6 付款失敗」
        const pay_failed_sql = `UPDATE order_history SET order_status_sid = 6 WHERE order_num = ${ordernum}`;
        const [pay_failed_row] = await db.query(pay_failed_sql);
        console.log('付款狀態更新為付款失敗');
        res.json({
            success: false,
            message: linePayRes,
        });
    }
  
    } catch(error) {
      console.log(error.message);
    }
  
    res.end();
  })

router.post('/tappay/:ordernum', async (req, res) => {
    const mb_sid = req.query.mid
    const ordernum = req.query.ordernum

    // 將訂單寫入訂單/明細(狀態：未付款)
    try {
        const add_order_history_sql = `INSERT INTO order_history (order_num, created_at, shop_sid, origin_total, total, mb_sid, order_status_sid, order_payment_sid) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)`;
        const [add_order_history_row] = await db.query(add_order_history_sql, [
            ordernum,
            req.body.userCart[0].shop_sid,
            req.body.totalUnitPrice,
            req.body.totalSalePrice,
            mb_sid,
            5,
            2
        ]);
        
        for(let i =0; i<req.body.userCart.length;i++){
            const add_order_details_sql = `INSERT INTO order_details (order_num, created_at, product_sid, product_name, quantity, origin_price, total_price) VALUES (?, NOW(), ?, ?, ?, ?, ?)`;
            const [add_order_details_rows] = await db.query(add_order_details_sql,[
                ordernum,
                req.body.userCart[i].prod_sid,
                req.body.userCart[i].name,
                req.body.userCart[i].amount,
                (req.body.userCart[i].unit_price * req.body.userCart[i].amount),
                (req.body.userCart[i].sale_price * req.body.userCart[i].amount),
            ])
            
        } 

        console.log('訂單成功寫入資料庫，成功更新庫存數量')
    }
    catch (error) {
        console.log(error.message)
    }

    // 將商品資料整理成line pay格式
    const items = req.body.userCart.map(i=>{
        const {amount, name, prod_sid, sale_price, unit_price} = i;
        return {
            id: prod_sid,
            name,
            quantity: amount,
            price: sale_price,
            originalPrice: unit_price,
        }
    })

    const order = {
        orderId: req.body.userCart[0].shop_sid,
        amount: req.body.totalSalePrice,

        packages:[
            {
                id: '1',
                amount: req.body.totalSalePrice,
                products: items
            }
        ],
        
    }
    orders[order.orderId] = order;
    console.log('orders: ', orders);
    // console.log('create-order', order);

    try {
    const linePayBody = createLinePayBody(order);

    const uri = '/payments/request';
    const headers = createSignature(uri, linePayBody);

    const url = ``;
    const linePayRes = await axios.post(url, linePayBody, {headers });
    // console.log(headers);
    // console.log(linePayRes.data.info);
    // console.log({linePayBody})
    // console.log(JSON.stringify(linePayBody, null, 4))
    // console.log(linePayRes);

    if(linePayRes?.data?.returnCode === '0000') {
        res.json({
            success: true,
            url: linePayRes?.data?.info.paymentUrl.web
        });
    } else {
        res.json({
            success: false,
            message: '訂單不存在',
        });
    }

    }
    catch(error) {
        console.log(error.message);
    }

})
// CartDone - 訂單成功頁面帶出該筆訂單記錄
// 歷史訂單+付款方式
router.get('/payment-done/:mbsid', async (req, res) => {
    const mbsid = req.params.mbsid

    const this_order_details_sql = `SELECT * FROM order_history 
    JOIN order_status ON order_history.order_status_sid = order_status.sid 
    JOIN order_payment ON order_history.order_payment_sid = order_payment.sid 
    ORDER BY order_history.created_at DESC LIMIT 1 `;

    // const this_order_details_sql = `SELECT * FROM order_history 
    // JOIN order_details ON order_history.order_num = order_details.order_num 
    // JOIN order_status ON order_history.order_status_sid = order_status.sid 
    // JOIN order_payment ON order_history.order_payment_sid = order_payment.sid 
    // JOIN member ON order_history.mb_sid = member.mb_sid
    // WHERE order_history.mb_sid = ? 
    // ORDER BY order_history.created_at DESC`;
    const [this_order_details_rows] = await db.query(this_order_details_sql, [mbsid]);
    const row =  { ...this_order_details_rows}; 

    if(row[0]) {
        // console.log(row[0]);
        res.json({this_order_details_rows});
    } else {
        res.send('這個會員沒有對應的訂單記錄');
    }

})




module.exports = router;