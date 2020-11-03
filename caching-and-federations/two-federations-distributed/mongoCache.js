// Connection URL
const url = 'mongodb://localhost:27017';

const mongoose = require('mongoose');
mongoose.connect(url, {
  useNewUrlParser: true,
  seUnifiedTopology: true,
  auth: { user: 'root', password: 'example' },
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('connected to mongo');
});

const cacheSchema = new mongoose.Schema({
  cacheKey: String,
  value: String,
  ttl: Number,
});

const Cache = mongoose.model('cache', cacheSchema);

const makeMongoCache = ({ ttlInMs }) => ({
  get: async (key) => {
    const now = new Date().getTime();
    const res = await Cache.findOne({ cacheKey: key }).where('ttl').gte(now);
    if (res && res.value) {
      console.log('mongo hit!');
      return JSON.parse(res.value);
    }
    return null;
  },
  set: async (key, val) => {
    console.log('setting mongo val');
    const ttlTime = new Date().getTime() + ttlInMs;
    const newEntry = new Cache({
      cacheKey: key,
      value: JSON.stringify(val),
      ttl: ttlTime,
    });
    return newEntry.save();
  },
});

exports.makeMongoCache = makeMongoCache;
