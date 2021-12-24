const util = require("util");
const redis = require("redis");
const config = require("../config/keys");
const mongoose = require("mongoose");
const client = redis.createClient(config.redisURL);

client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this._cache = true;
  this._hashKey = JSON.stringify(options.key || "");
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this._cache) {
    return exec.apply(this, arguments);
  }
  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  const cachedValue = await client.hget(this._hashKey, key);

  if (cachedValue) {
    console.log("cached");
    const doc = JSON.parse(cachedValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }
  console.log("set cached");
  const result = await exec.apply(this, arguments);
  client.hset(this._hashKey, key, JSON.stringify(result));
  return result;
};

module.exports = {
  clearHash: (key) => client.del(JSON.stringify(key)),
};
