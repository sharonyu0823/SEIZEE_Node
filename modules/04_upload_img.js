const multer = require("multer");
// const { v4: uuidv4 } = require("uuid");

const extMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

const fileFilter = (req, file, callback) => {
  callback(null, !!extMap[file.mimetype]);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/../public/uploads/04-product");
  },
  filename: (req, file, cb) => {
    // console.log('aaa:', file)
    // const ext = extMap[file.mimetype];
    cb(null, file.originalname);
  },
});

module.exports = multer({ storage, fileFilter });