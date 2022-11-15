const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const jwt = require("jsonwebtoken");
// const Joi= require('joi');

// ====================================
// 註冊
router.post("/register", async (req, res) => {
  const output = {
    success: false,
    error: {},
  };

  // 這邊要把checkuser的錯誤try catch在這邊
  const sql = "SELECT * FROM `member` WHERE `mb_email` = ?";
  const [result] = await db.query(sql, [req.body.mbrEmail]);

  try {
    const sql =
      "INSERT INTO `member`(`mb_name`, `mb_email`, `mb_pass`, `mb_created_at`, `last_login_at`, `mb_status`) VALUES (?, ?, ?, NOW(), NOW(), 1)";

    // console.log(req.body)

    const [result] = await db.query(sql, [
      req.body.mbrName,
      req.body.mbrEmail,
      req.body.mbrPass,
    ]);

    if (result.affectedRows) output.success = true;
  } catch {
    output.success = false;
    output.error = "帳號重覆";
  }

  res.json(output);
});

// ====================================
// 註冊-帳號重複
router.post("/checkUser", async (req, res) => {
  const output = {
    success: false,
    error: {},
  };

  const sql = "SELECT * FROM `member` WHERE `mb_email` = ?";

  const [result] = await db.query(sql, [req.body.mbrEmail]);

  // console.log(result)
  // console.log(!result)
  // console.log(result.length)

  if (result.length === 1) {
    output.success = false;
    output.error = "帳號重覆";
  } else {
    output.success = true;
  }

  res.json(output);
});

// ====================================
// 登入
router.post("/login", async (req, res) => {
  const output = {
    success: false,
    error: {},
    auth: {},
  };

  const sql = "SELECT * FROM `member` WHERE `mb_email` = ?";

  const [result] = await db.query(sql, [req.body.mblEmail]);
  const row = result[0];
  //   console.log(result);
  // console.log(result.length)

  // 登入帳號的驗證 去users查看有沒有這組帳號 如果不存在 就回傳錯誤
  if (result.length === 1) {
    output.success = true;
  } else {
    output.success = false;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  // 登入密碼的驗證
  if (req.body.mblPass === row.mb_pass) {
    output.success = true;
  } else {
    output.success = false;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }
  // console.log(result[0].mb_pass)

  // 判斷狀態是啟用還是停用
  if (row.mb_status === "1") {
    output.success = true;
  } else {
    output.success = false;
    output.error = "帳號停用";
    return res.json(output);
  }

  // 更新登入時間
  if (output.success) {
    // 更新登入時間
    const sql = "UPDATE `member` SET `last_login_at`=? WHERE mb_email = ?";
    const [result] = await db.query(sql, [new Date(), req.body.mblEmail]);

    // JWT
    const { mb_sid, mb_photo, mb_email } = row;
    // console.log(row);
    const token = jwt.sign(
      {
        mb_sid,
        mb_photo,
        mb_email,
      },
      process.env.JWT_SECRET
    );
    console.log(row);
    // console.log(token);
    output.auth = {
      mb_sid,
      mb_photo,
      mb_email,
      token,
    };
  }

  res.json(output);
});

// ====================================
// 忘記密碼
router.post("/forgotPass", async (req, res) => {
  const output = {
    success: false,
    error: {},
  };

  // TODO: 有沒有email 然後用後端發送email
  // uuid

  const sql = "SELECT * FROM `member` WHERE `mb_email` = ?";

  const [result] = await db.query(sql, [req.body.mbfEmail]);

  // console.log(result);
  // console.log(!result);
  // console.log(result.length);

  if (result.length === 1) {
    output.success = true;
  } else {
    output.success = false;
    output.error = "帳號不存在";
  }

  res.json(output);
});

// ====================================
// 忘記密碼-更換密碼
router.put("/updatePass", async (req, res) => {
  const output = {
    success: false,
    error: {},
  };

  // TODO: 更換密碼適用uuid判斷

  const sql = "UPDATE `member` SET `mb_pass`=? WHERE mb_email = ?";

  const [result] = await db.query(sql, [req.body.mbPass, req.body.mbEmail]);

  if (result.changedRows) output.success = true;

  res.json(output);
});

// 登入之後
// ====================================
// 個人資料-讀取
router.get("/profile/:sid", async (req, res) => {
  const output = {
    success: false,
    error: {},
  };

  // TODO: 從JWT拿sid 網址sid拿掉

  const sql = "SELECT * FROM `member` WHERE `mb_sid` = ?";
  const [rows] = await db.query(sql, [req.params.sid]);

  if (rows.length === 1) {
    output.success = true;
  }
  // console.log(rows);
  // console.log(!rows);
  // console.log(!rows.length);

  res.json(output);
});

// ====================================
// 個人資料-編輯
router.put("/profile/:sid", async (req, res) => {
  const output = {
    success: false,
    error: {},
  };

  // TODO: 從JWT拿sid 網址sid拿掉

  const sql =
    "UPDATE `member` SET `mb_photo`=?,`mb_nickname`=?,`mb_gender`=?,`mb_address_city`=?,`mb_address_area`=?,`mb_address_detail`=?,`mb_phone`=? WHERE `mb_sid`= ?";
  const [result] = await db.query(sql, [
    req.body.mbPhoto,
    req.body.mbNickname,
    req.body.mbGender,
    req.body.mbAddressCity,
    req.body.mbAddressArea,
    req.body.mbAddressDetail,
    req.body.mbPhone,
    req.params.sid,
  ]);

  if (result.changedRows) output.success = true;
  console.log(result.changedRows);

  res.json(output);
});

// ====================================
// 刪除帳號
router.delete("/deleteAccount/:sid", async (req, res) => {
  const output = {
    success: false,
    error: {},
  };

  // TODO: 從JWT拿sid 網址sid拿掉
  const sql = "DELETE FROM `member` WHERE `mb_sid`= ?";
  const [result] = await db.query(sql, [req.params.sid]);

  res.json({ success: !!result.affectedRows });
  // console.log(result.affectedRows) // 1
  // console.log(!result.affectedRows) // false
  // console.log(!!result.affectedRows) // true
});

module.exports = router;
