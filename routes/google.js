const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

// 載入 GCP OAuth 2.0 用戶端 ID 憑證
const keys = require(__dirname + "/../client_secret.json");

const oAuth2c = new OAuth2Client(
  keys.web.client_id,
  keys.web.client_secret,
  keys.web.redirect_uris[2]
  // 測試, http://localhost:3000/callback
);

router.get("/", async (req, res) => {
  const output = {
    success: false,
    error: "",
    title: "",
  };

  // scopes 參考: https://developers.google.com/people/api/rest/v1/people/get
  const authorizeUrl = oAuth2c.generateAuthUrl({
    access_type: "offline",
    // 欲取得 email, 要兩個 scopes
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    // prompt: "consent",
  });

  // console.log("authorizeUrl", authorizeUrl);
  // console.log('end')
  // console.log('res', res)

  output.title = authorizeUrl;
  output.success = true;

  res.json(output);
});

router.get("/callback", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // qs 內容參考 /references/redirect-query-string.json
  const qs = req.query;
  let myData = {};

  // console.log("qs1", qs);
  // console.log("qs1.code", qs.code);
  // console.log("myData1", myData);

  if (qs.code) {
    // 內容參考 /references/from-code-to-tokens.json
    const r = await oAuth2c.getToken(qs.code);
    // console.log(JSON.stringify(r, null, 2));
    oAuth2c.setCredentials(r.tokens);

    // console.log("r", r);

    // 連線回應內容參考 /references/tokeninfo-results-oauth2.googleapis.com.json
    console.log(
      "token",
      `https://oauth2.googleapis.com/tokeninfo?id_token=${r.tokens.id_token}`
    );

    const url =
      "https://people.googleapis.com/v1/people/me?personFields=names%2CemailAddresses%2Cphotos";

    const response = await oAuth2c.request({ url });

    // console.log("oAuth2c response", response);
    return res.json({ success: true, data: response.data });
    // response 內容參考 /references/people-api-response.json
    myData = response.data;

    const { names, photos, emailAddresses } = myData;

    console.log("qs2", qs);
    console.log("qs1.code", qs.code);
    console.log("myData2", myData);
    console.log("myData2, name", names[0].displayName);
    console.log("myData2, photo", photos[0].url);
    console.log("myData2, email", emailAddresses[0].value);
  }

  // const { names, photos, emailAddresses } = myData;

  // console.log("qs2", qs);
  // console.log("qs1.code", qs.code);
  // console.log("myData2", myData);
  // console.log("myData2, name", names[0].displayName);
  // console.log("myData2, photo", photos[0].url);
  // console.log("myData2, email", emailAddresses[0].value);

  // const sql = "SELECT * FROM `member` WHERE `mb_email` = ?";
  // const [result] = await db.query(sql, [emailAddresses[0].value]);

  // console.log("3");

  // if (result.length === 1) {
  //   const row = result[0];

  //   // JWT
  //   const { mb_sid, mb_photo, mb_name, mb_email } = row;
  //   // console.log(row);
  //   const token = jwt.sign(
  //     {
  //       mb_sid,
  //       mb_photo,
  //       mb_name,
  //       mb_email,
  //     },
  //     process.env.JWT_SECRET
  //   );
  //   // console.log(row);
  //   // console.log("token", token);

  //   output.auth = {
  //     mb_sid,
  //     mb_photo,
  //     mb_name,
  //     mb_email,
  //     token,
  //   };

  //   // console.log("result: ", result);
  //   // console.log("result.length: ", result.length);
  //   // output.success = false;
  //   // output.error = "帳號重覆";

  //   console.log("1");
  // } else {
  //   try {
  //     const sql =
  //       "INSERT INTO `member`(`mb_photo`,`mb_name`, `mb_email`, `mb_pass`,`mb_gender`, `mb_address_city`, `mb_address_area`, `mb_address_detail`, `mb_phone`, `mb_created_at`, `last_login_at`, `mb_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)";

  //     console.log("2");

  //     // console.log(req.body)

  //     // console.log(encryptedPass);

  //     const [result] = await db.query(sql, [
  //       "noname.png",
  //       names[0].displayName,
  //       emailAddresses[0].value,
  //       "",
  //       "",
  //       "",
  //       "",
  //       "",
  //       "",
  //     ]);

  //     if (result.affectedRows) {
  //       const row = result[0];

  //       // JWT
  //       const { mb_sid, mb_photo, mb_name, mb_email } = row;
  //       // console.log(row);
  //       const token = jwt.sign(
  //         {
  //           mb_sid,
  //           mb_photo,
  //           mb_name,
  //           mb_email,
  //         },
  //         process.env.JWT_SECRET
  //       );
  //       // console.log(row);
  //       // console.log("token", token);

  //       output.auth = {
  //         mb_sid,
  //         mb_photo,
  //         mb_name,
  //         mb_email,
  //         token,
  //       };

  //       output.success = true;
  //     }
  //   } catch (e) {
  //     output.success = false;
  //     output.error = "發生錯誤";

  //     console.log(e);

  //     console.log("4");
  //   }
  // }

  // output.success = true;

  res.json(output);
});

module.exports = router;
