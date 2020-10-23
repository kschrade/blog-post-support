const express = require('express');
const app = express();
const port = 4002;

const products = [
  {
    upc: '1',
    name: 'Table',
    price: 899,
    weight: 100,
  },
  {
    upc: '2',
    name: 'Couch',
    price: 1299,
    weight: 1000,
  },
  {
    upc: '3',
    name: 'Chair',
    price: 54,
    weight: 50,
  },
];

const inventory = [
  { upc: '1', inStock: true },
  { upc: '2', inStock: false },
  { upc: '3', inStock: true },
];

app.get('/', (req, res) => {
  console.log('Back end service responding.');
  res.send(products);
});

app.get('/v2/', (req, res) => {
  console.log('Back end service responding.');
  res.send({ products, inventory });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
