const express = require('express');
const app = express();
const port = 3000;

const produtos = require('./data/produtos.json');

app.get('/produtos', (req, res) => {
  res.json(produtos);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});