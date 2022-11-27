const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const upload = require(__dirname + "/../modules/upload_img");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const nodemailer = require("nodemailer");

// ====================================
// 註冊
router.post("/register", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // 這邊要把checkuser的錯誤try catch在這邊
  const sql = "SELECT * FROM `member` WHERE `mb_email` = ?";
  const [result] = await db.query(sql, [req.body.mbrEmail]);
  console.log("I am here");

  if (result.length === 1) {
    console.log("result: ", result);
    console.log("result.length: ", result.length);
    output.success = false;
    output.error = "帳號重覆";
  } else {
    try {
      const sql =
        "INSERT INTO `member`(`mb_photo`,`mb_name`, `mb_email`, `mb_pass`,`mb_gender`, `mb_address_city`, `mb_address_area`, `mb_address_detail`, `mb_phone`, `mb_created_at`, `last_login_at`, `mb_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)";

      // console.log(req.body)

      const [result] = await db.query(sql, [
        "noname.png",
        req.body.mbrName,
        req.body.mbrEmail,
        req.body.mbrPass,
        req.body.mbuGender,
        req.body.mbuAddressCity,
        req.body.mbuAddressArea,
        req.body.mbuAddressDetail,
        req.body.mbuPhone,
      ]);

      if (result.affectedRows) output.success = true;
    } catch (e) {
      output.success = false;
      output.error = "發生錯誤";

      console.log(e);
    }
  }

  res.json(output);
});

// ====================================
// 註冊-帳號重複
router.post("/checkUser", async (req, res) => {
  const output = {
    success: false,
    error: "",
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
    error: "",
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
    // console.log(row);
    // console.log("token", token);

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
router.post("/checkForgotPass", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

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

// 忘記密碼-發送信件
router.post("/sendForgotPass", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // 確認資料庫有沒有這個email
  const sql = "SELECT * FROM `member` WHERE `mb_email` = ?";

  const [result] = await db.query(sql, [req.body.mbfEmail]);
  console.log("forgot result", result);
  // console.log(!result);
  console.log("result.length", result.length);
  console.log("result.mb_name", result[0].mb_name);

  // 利用JWT產生token 並暫時存在資料庫
  const row = result[0];
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
  // console.log(row);
  // console.log("checkForgotPass token", token);

  // 有的話，用後端發送email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "seizee1214@gmail.com",
      pass: "smvjibastauhypeo",
    },
  });

  const mailOptions = {
    from: "seizee1214@gmail.com",
    to: req.body.mbfEmail,
    subject: "[SEIZEE] 密碼重設",
    html: `<p>親愛的 ${result[0].mb_name} 您好</p><p>請點選 <a href="http://localhost:${process.env.FRONT_END_PORT}/reset-pass?token=${token}">重設密碼</a> 重新設定您的新密碼，謝謝。</p>`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    // console.log(info);
    console.log("Email sent: " + info.response);
    output.success = true;
  } catch (error) {
    // console.log(error);
    output.success = false;
  }
  // console.log(error)

  if (output.success) {
    const sql = "UPDATE `member` SET `mb_forget_pass`=? WHERE mb_email = ?";

    const result = await db.query(sql, [token, req.body.mbfEmail]);

    if (result.affectedRows) output.success = true;
  }

  res.json(output);

  // Node.js Send an Email: https://www.w3schools.com/nodejs/nodejs_email.asp
  // Node.js 透過 Gmail 發送信件: https://learningsky.io/how-to-send-the-email-using-the-gmail-smtp-in-node-js/
  // nodemailer: https://nodemailer.com/about/#example
});

// ====================================
// 忘記密碼-更換密碼
router.put("/updatePass", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  console.log(req.body);

  // TODO: 更換密碼適用uuid判斷

  const sql =
    "UPDATE `member` SET `mb_pass`=?, `mb_forget_pass`=? WHERE `mb_sid` = ?";

  const [result] = await db.query(sql, [
    req.body.mbResetPass,
    null,
    res.locals.auth.mb_sid,
  ]);

  if (result.changedRows) output.success = true;

  res.json(output);
});

// 登入之後
// ====================================
// 個人資料-讀取
router.get("/profile", async (req, res) => {
  const output = {
    success: false,
    error: "",
    row: [],
  };

  // if(res.locals.auth.account) {
  // return
  // }

  // TODO: 從JWT拿sid 網址sid拿掉

  const sql = "SELECT * FROM `member` WHERE `mb_sid` = ?";
  const [row] = await db.query(sql, [res.locals.auth.mb_sid]);

  if (row.length === 1) {
    output.success = true;
    output.row = row[0];
  }
  // console.log("row", row);
  // console.log("row[0]", row[0]);
  // console.log("!row", !row);
  // console.log(!rows.length);

  res.json(output);
});

// ====================================
// 個人資料-編輯
router.put("/profile", upload.single("mb_photo"), async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // TODO: 從JWT拿sid 網址sid拿掉

  if (!!req.file) {
    const sql =
      "UPDATE `member` SET `mb_photo`=?,`mb_gender`=?,`mb_address_city`=?,`mb_address_area`=?,`mb_address_detail`=?,`mb_phone`=? WHERE `mb_sid`= ?";

    // console.log("gender:", req.body.mb_gender);

    const [result] = await db.query(sql, [
      req.file.originalname,
      req.body.mb_gender,
      req.body.mb_address_city,
      req.body.mb_address_area,
      req.body.mb_address_detail,
      req.body.mb_phone,
      res.locals.auth.mb_sid,
    ]);

    if (result.changedRows) {
      output.success = true;
    } else {
      output.error = "沒有更新1";
    }
  } else {
    const sql1 =
      "UPDATE `member` SET `mb_gender`=?,`mb_address_city`=?,`mb_address_area`=?,`mb_address_detail`=?,`mb_phone`=? WHERE `mb_sid`= ?";

    const [result] = await db.query(sql1, [
      req.body.mb_gender,
      req.body.mb_address_city,
      req.body.mb_address_area,
      req.body.mb_address_detail,
      req.body.mb_phone,
      res.locals.auth.mb_sid,
    ]);

    // console.log("gender:", req.body.mb_gender);

    if (result.changedRows) {
      output.success = true;
    } else {
      output.error = "沒有更新2";
    }
  }

  // console.log(result.changedRows);
  // console.log(req.body.mbuPhoto);
  // console.log(req.file);
  // console.log(req.file.originalname);
  // console.log(req.file);
  // console.log(req.body.mb_gender);
  // console.log(req.body.mb_phone);

  res.json(output);
});

// 個人資料-編輯-更改JWT AUTH資料(一旦個人資料更新後)
router.post("/updateAuth", async (req, res) => {
  const output = {
    success: false,
    error: "",
    auth: {},
  };

  const sql = "SELECT * FROM `member` WHERE `mb_sid` = ?";

  const [result] = await db.query(sql, [res.locals.auth.mb_sid]);
  const row = result[0];
  // console.log('auth res.locals.auth', res.locals.auth);
  // console.log('auth res.locals.auth.mb_sid', res.locals.auth.mb_sid);
  // console.log('auth result', result);
  // console.log('auth row', row);
  // console.log(row.length);

  if (row) {
    output.success = true;
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
    // console.log(row);
    // console.log("token", token);

    output.auth = {
      mb_sid,
      mb_photo,
      mb_email,
      token,
    };
  } else {
    output.success = false;
    output.error = "尚未更新";
  }

  res.json(output);
});

// ====================================
// 刪除帳號
router.delete("/deleteAccount/:sid", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // TODO: 從JWT拿sid 網址sid拿掉
  const sql = "DELETE FROM `member` WHERE `mb_sid`= ?";
  const [result] = await db.query(sql, [res.locals.auth.mb_sid]);

  res.json({ success: !!result.affectedRows });
  // console.log(result.affectedRows) // 1
  // console.log(!result.affectedRows) // false
  // console.log(!!result.affectedRows) // true
});

module.exports = router;
