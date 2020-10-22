const memoization = (innerFn, getKeyFn, cache) => async (...args) => {
  const key = getKeyFn(args);

  try {
    const cacheVal = await cache.get(key);
    if (cacheVal) {
      console.log('Cache Hit!');
      return cacheVal;
    }
    console.log('Cache Miss!');
  } catch (e) {
    console.log(e);
  }

  const res = await innerFn(args);

  try {
    await cache.set(key, res);
  } catch (e) {
    console.log(e);
  }

  return res;
};

exports.memoization = memoization;
