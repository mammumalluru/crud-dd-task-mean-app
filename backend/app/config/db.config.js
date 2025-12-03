// module.exports = {
//   url: "mongodb://localhost:27017/dd_db"
// };


// app/config/db.config.js
module.exports = {
  url: process.env.MONGO_URL || "mongodb://localhost:27017/dd_db"
};