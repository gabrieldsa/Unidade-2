// --- 1. Importações ---
// Importa o Express, a framework principal do nosso backend.
const express = require('express');
// Importa o 'fs/promises' para ler e escrever ficheiros de forma assíncrona (sem bloquear o servidor).
const fs = require('fs/promises');
// Importa o 'cors' para permitir que o nosso frontend (a correr no browser) possa fazer chamadas a este backend.
const cors = require('cors');

// --- 2. Configuração Inicial ---
const app = express();
const PORT = 3000; // Define a porta onde o servidor vai rodar.
const DB_FILE = './dados.json'; // Define o caminho para a nossa base de dados JSON.

// --- 3. Middlewares (Funções Globais) ---
// Middleware para que o Express consiga ler o JSON enviado pelo Front-end (ex: req.body em POST, PUT).
app.use(express.json());
// Ativa o CORS para todas as rotas.
app.use(cors());
// Middleware para servir ficheiros estáticos (HTML, CSS, JS) da pasta atual ('.').
// (Embora não seja estritamente necessário se o frontend estiver a ser aberto via file://, é boa prática).
app.use(express.static('.'));

// --- Funções Auxiliares (Helpers) para ler/escrever o JSON ---
// (Estas funções evitam repetição de código)

/**
 * Lê o ficheiro dados.json e retorna o seu conteúdo como um objeto JS.
 * @returns {Promise<object>} Um objeto contendo { produtos: [], usuarios: [] }
 */
const lerBaseDeDados = async () => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Se o ficheiro não existir ou estiver corrompido, retorna uma estrutura vazia
        console.error("Erro ao ler a base de dados:", error.message);
        return { produtos: [], usuarios: [] };
    }
};

/**
 * Escreve o objeto JS completo de volta no ficheiro dados.json.
 * @param {object} dados O objeto completo { produtos, usuarios } para salvar.
 */
const escreverBaseDeDados = async (dados) => {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(dados, null, 2), 'utf8');
    } catch (error) {
        console.error("❌ FALHA CRÍTICA NA GRAVAÇÃO:", error.message);
        throw new Error("Falha ao salvar os dados no disco.");
    }
};

// ========================================================================
// --- 4. ROTAS DE PRODUTOS (/produtos) ---
// ========================================================================

// Rota para todos os produtos (GET /produtos)
// Esta rota suporta ?search=... e ?sort=...
app.get('/produtos', async (req, res) => {
    // Captura os parâmetros da URL (query string)
    const { search, sort } = req.query;

    try {
        // [CORREÇÃO] Lê a base de dados inteira
        const dados = await lerBaseDeDados();
        let produtos = dados.produtos; // Pega apenas a lista de produtos

        // 1. FILTRAGEM (Busca)
        if (search) {
            console.log(`Buscando por: "${search}"`);
            produtos = produtos.filter(p =>
                p.nome.toLowerCase().includes(search.toLowerCase()) ||
                (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // 2. ORDENAÇÃO
        if (sort === 'nome') {
            console.log("Ordenando por nome (A-Z)");
            produtos.sort((a, b) => a.nome.localeCompare(b.nome));
        }

        res.json(produtos); // Retorna a lista filtrada e/ou ordenada

    } catch (error) {
        console.error("Erro ao ler ou processar dados.json:", error);
        res.status(500).json({ mensagem: 'Erro interno ao buscar produtos.' });
    }
});

// Rota para produto por ID (GET /produtos/:id) - PÁGINA DE DETALHES
app.get('/produtos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dados = await lerBaseDeDados();
        const produto = dados.produtos.find(p => p.id === id);

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

// Rota de Cadastro de Produto (POST /produtos)
app.post('/produtos', async (req, res) => {
    const novoProduto = req.body;
    console.log('✅ Recebida requisição POST para /produtos');

    try {
        // 1. LÊ a base de dados inteira
        const dados = await lerBaseDeDados();

        // 2. ATRIBUI um novo ID (baseado no último ID de PRODUTO)
        const ultimoProduto = dados.produtos[dados.produtos.length - 1];
        const newId = ultimoProduto ? ultimoProduto.id + 1 : 1;
        novoProduto.id = newId;

        // 3. ADICIONA o novo produto à lista de produtos
        dados.produtos.push(novoProduto);

        // 4. [CORREÇÃO] ESCREVE a base de dados inteira (dados) de volta no ficheiro
        await escreverBaseDeDados(dados);
        console.log(`💾 Produto ID ${newId} gravado com sucesso no JSON.`);
        
        // 5. Responde ao Front-end
        res.status(201).json(novoProduto);

    } catch (error) {
        console.error("Erro no processamento da requisição POST:", error.message);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

// ROTA DE EDIÇÃO DE PRODUTO (PUT ou PATCH)
// Usamos PUT, mas o frontend (script.js) está a enviar um PATCH.
// O ideal é usar PATCH para atualização parcial. Vou mudar para PATCH.
app.patch('/produtos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const dadosAtualizados = req.body;
    console.log(`✏️ Recebida requisição PATCH para /produtos/${id}`);

    try {
        const dados = await lerBaseDeDados();

        // Encontra o índice do produto a ser editado
        const indice = dados.produtos.findIndex(p => p.id === id);

        if (indice === -1) {
            return res.status(404).json({ mensagem: 'Produto não encontrado para edição.' });
        }

        // Atualiza os dados do produto (mescla o antigo com o novo)
        dados.produtos[indice] = { ...dados.produtos[indice], ...dadosAtualizados };
        // Garante que o ID não mude (caso venha no body)
        dados.produtos[indice].id = id; 

        // [CORREÇÃO] Reescreve a base de dados inteira
        await escreverBaseDeDados(dados);
        console.log(`💾 Produto ID ${id} atualizado com sucesso no JSON.`);
        return res.status(200).json(dados.produtos[indice]);

    } catch (error) {
        console.error("Erro ao processar edição:", error);
        return res.status(500).json({ mensagem: 'Erro interno ao tentar editar o produto.' });
    }
});

// Rota de Exclusão de Produto (DELETE /produtos/:id)
app.delete('/produtos/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`❌ Recebida requisição DELETE para /produtos/${id}`);

    try {
        const dados = await lerBaseDeDados();

        // Filtra a lista, mantendo todos os produtos EXCETO o que tem o ID correspondente
        const novosProdutos = dados.produtos.filter(p => p.id !== id);

        // Verifica se algum produto foi realmente removido
        if (novosProdutos.length === dados.produtos.length) {
            return res.status(404).json({ mensagem: 'Produto não encontrado para exclusão.' });
        }

        // Atualiza a lista de produtos no objeto principal
        dados.produtos = novosProdutos;

        // [CORREÇÃO] Reescreve a base de dados inteira
        await escreverBaseDeDados(dados);
        console.log(`✅ Produto ID ${id} excluído com sucesso do JSON.`);
        return res.status(200).json({ mensagem: 'Produto excluído com sucesso.' });

    } catch (error) {
        console.error("Erro ao processar exclusão:", error);
        return res.status(500).json({ mensagem: 'Erro interno ao tentar excluir o produto.' });
    }
});


// ========================================================================
// --- 5. [NOVAS] ROTAS DE USUÁRIOS (/usuarios) ---
// ========================================================================
// Estas são as rotas que faltavam para o script.js (frontend) funcionar.

/**
 * Rota GET /usuarios
 * Usada para duas coisas pelo frontend:
 * 1. Login (GET /usuarios?email=...&senha=...)
 * 2. Verificação de email (GET /usuarios?email=...)
 */
app.get('/usuarios', async (req, res) => {
    const { email, senha } = req.query;

    try {
        const dados = await lerBaseDeDados();
        let usuarios = dados.usuarios;

        // Se um email foi fornecido, filtra por email
        if (email) {
            usuarios = usuarios.filter(u => u.email.toLowerCase() === email.toLowerCase());
        }
        
        // Se uma senha foi fornecida (Lógica de Login), filtra também pela senha
        // NOTA: Em produção, NUNCA guarde senhas em texto puro. Use 'bcrypt'.
        if (senha) {
            usuarios = usuarios.filter(u => u.senha === senha);
        }

        console.log(`🔍 GET /usuarios?email=${email} - Encontrados: ${usuarios.length}`);
        res.json(usuarios); // Retorna a lista (vazia ou com o usuário)

    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        res.status(500).json({ mensagem: 'Erro interno ao buscar usuários.' });
    }
});

/**
 * Rota POST /usuarios
 * Usada para o Cadastro de novos usuários.
 */
app.post('/usuarios', async (req, res) => {
    const novoUsuario = req.body;
    console.log('✅ Recebida requisição POST para /usuarios (Cadastro)');

    // Validação básica (o frontend já faz, mas o backend deve garantir)
    if (!novoUsuario.email || !novoUsuario.senha || !novoUsuario.nivel) {
        return res.status(400).json({ error: 'Email, senha e nível são obrigatórios.' });
    }
    
    try {
        const dados = await lerBaseDeDados();

        // [Validação extra] Verifica se o email já existe
        const emailJaExiste = dados.usuarios.some(u => u.email.toLowerCase() === novoUsuario.email.toLowerCase());
        if (emailJaExiste) {
            return res.status(400).json({ error: 'Este email já está cadastrado.' });
        }

        // Atribui um novo ID (baseado no último ID de USUÁRIO)
        const ultimoUsuario = dados.usuarios[dados.usuarios.length - 1];
        const newId = ultimoUsuario ? ultimoUsuario.id + 1 : 1;
        novoUsuario.id = newId;

        // Adiciona o novo usuário à lista de usuários
        dados.usuarios.push(novoUsuario);

        // Escreve a base de dados inteira de volta no ficheiro
        await escreverBaseDeDados(dados);
        console.log(`💾 Usuário ID ${newId} (email: ${novoUsuario.email}) gravado com sucesso.`);

        // Responde ao Front-end
        res.status(201).json(novoUsuario);

    } catch (error) {
        console.error("Erro no processamento do POST /usuarios:", error.message);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});


// --- 6. INICIA O SERVIDOR ---
app.listen(PORT, () => {
    console.log('========================================================');
    console.log(`✅ Servidor Express customizado (index.js) a rodar.`);
    console.log(`A ler e escrever no ficheiro: ${DB_FILE}`);
    console.log(`✅ Servidor pronto para receber requisições em http://localhost:${PORT}`);
    console.log('========================================================');
});

