const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  await next();
  console.log("clearing cached");
  clearHash(req.user.id);
};
