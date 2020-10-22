const memoization = (innerFn, getKeyFn, cache) => async (...args) => {
  const key = getKeyFn(args);

  try {
    const cacheVal = await cache.get(key);
    if (cacheVal) {
      return cacheVal;
    }
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

const fun = (name) => {
  console.log('internal');
  return `hello ${name}`;
};

let cache = {};

const test = async () => {
  const lotsOfFun = memoization(
    fun,
    (key) => {
      console.log('get key:', key);
      return key;
    },
    {
      get: (key) => cache[key],
      set: (key, val) => (cache[key] = val),
    }
  );

  const result1 = await lotsOfFun('kyle');
  const result2 = await lotsOfFun('kyle');
  const result3 = await lotsOfFun('kylee');
  console.log('end results:', [result1, result2, result3].join(', '));
};

test();

/*
output

get key:["kyle"]
internal

get key:["kyle"]

get key:["kylee"]
internal

end results:hello kyle, hello kyle, hello kylee
*/
