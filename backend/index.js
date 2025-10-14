const express = require('express');
const app = express();
const fs = require('fs/promises'); // Importa a versão de Promessas do File System
const cors = require('cors');
const PORT = 3000;

// Middleware para que o Express consiga ler o JSON enviado pelo Front-end (POST)
app.use(express.json()); 
app.use(cors());

// Middleware para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static('.'));

// Rota para todos os produtos (GET)
app.get('/produtos', async (req, res) => {
    try {
        const data = await fs.readFile('./produtos.json', 'utf8');
        const produtos = JSON.parse(data);
        res.json(produtos);
    } catch (error) {
        console.error("Erro ao ler produtos.json:", error);
        res.status(500).json({ mensagem: 'Erro interno ao buscar produtos.' });
    }
});

// Rota para produto por ID (GET)
app.get('/produtos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = await fs.readFile('./produtos.json', 'utf8');
        const produtos = JSON.parse(data);
        const produto = produtos.find(p => p.id === id);

        if (produto) {
            res.json(produto);
        } else {
            res.status(404).json({ mensagem: 'Produto não encontrado' });
        }
    } catch (error) {
        console.error("Erro ao buscar produto por ID:", error);
        res.status(500).json({ mensagem: 'Erro interno ao buscar produto.' });
    }
});

// Rota de Cadastro de Produto (POST)
app.post('/produtos', async (req, res) => {
    // req.body contém o JSON enviado pelo Front-end
    const novoProduto = req.body;
    
    console.log('✅ Recebida requisição POST para /produtos');
    
    try {
        // 1. LÊ a lista atual de produtos
        const data = await fs.readFile('./produtos.json', 'utf8');
        const produtos = JSON.parse(data);

        // 2. ATRIBUI um novo ID
        const newId = produtos.length > 0 ? produtos[produtos.length - 1].id + 1 : 1;
        novoProduto.id = newId;

        // 3. ADICIONA o novo produto à lista
        produtos.push(novoProduto);

        // 4. ESCREVE a lista completa de volta no arquivo
        try {
            await fs.writeFile('./produtos.json', JSON.stringify(produtos, null, 2), 'utf8');
            console.log(`💾 Produto ID ${newId} gravado com sucesso no JSON.`);
        } catch (writeError) {
            // Este bloco captura erros de permissão ou caminho de arquivo
            console.error("❌ FALHA NA GRAVAÇÃO DO ARQUIVO produtos.json. Verifique as permissões:", writeError.message);
            return res.status(500).json({ mensagem: 'Erro do servidor: Falha na gravação dos dados.' });
        }

        // 5. Responde ao Front-end
        res.status(201).json(novoProduto);

    } catch (error) {
        console.error("Erro no processamento da requisição POST:", error.message);
        // Este bloco captura erros se o arquivo JSON não existir ou for ilegível
        if (error.code === 'ENOENT') {
             console.error("🚨 O arquivo produtos.json não foi encontrado!");
        }
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

// INICIA O SERVIDOR
app.listen(PORT, () => {
    console.log(`✅ Servidor pronto para receber requisições em http://localhost:${PORT}`);
});