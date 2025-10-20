document.addEventListener('DOMContentLoaded', () => {
    const formEdicao = document.getElementById('form-edicao');
    const mensagemElement = document.getElementById('mensagem-edicao');
    const btnVoltar = document.querySelector('.btn-voltar');

    // 1. Obter o ID do produto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = urlParams.get('id');

    // Se não houver ID, exibe erro e para
    if (!produtoId) {
        mensagemElement.innerHTML = `<p style="color: red;">ID do produto não especificado para edição.</p>`;
        return;
    }

    // Variável global para armazenar o ID ao longo do processo de edição
    let idProdutoSendoEditado = parseInt(produtoId);

    // 2. Função para carregar os dados do produto existente
    const carregarProduto = async () => {
        try {
            const res = await fetch(`http://localhost:3000/produtos/${idProdutoSendoEditado}`);
            
            if (res.status === 404) {
                mensagemElement.innerHTML = `<p style="color: red;">Produto não encontrado no servidor.</p>`;
                return;
            }

            const produto = await res.json();
            
            // Pré-preencher o formulário
            document.getElementById('nome').value = produto.nome;
            document.getElementById('preco').value = produto.preco;
            document.getElementById('descricao').value = produto.descricao;
            document.getElementById('imagem').value = produto.imagem;

            // Ajustar o link "Voltar" para levar à página de detalhes
            btnVoltar.href = `detalhe.html?id=${idProdutoSendoEditado}`;

        } catch (error) {
            console.error('Erro ao carregar dados do produto:', error);
            mensagemElement.innerHTML = `<p style="color: red;">Falha ao conectar com o servidor para carregar o produto.</p>`;
        }
    };

    // Chamada inicial para carregar o produto
    carregarProduto();

    // 3. Listener para o envio do formulário de EDIÇÃO
    formEdicao.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Coletar os novos dados
        const produtoAtualizado = {
            id: idProdutoSendoEditado, // Garante que o ID é enviado
            nome: document.getElementById('nome').value.trim(),
            preco: parseFloat(document.getElementById('preco').value),
            descricao: document.getElementById('descricao').value.trim(),
            imagem: document.getElementById('imagem').value.trim()
        };

        // Validação (Simples)
        if (!produtoAtualizado.nome || isNaN(produtoAtualizado.preco) || produtoAtualizado.preco <= 0) {
            mensagemElement.innerHTML = `<p style="color: red;">Preencha Nome e Preço (deve ser maior que zero).</p>`;
            return;
        }

        // Requisição PUT para o servidor
        try {
            const res = await fetch(`http://localhost:3000/produtos/${idProdutoSendoEditado}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produtoAtualizado)
            });

            if (!res.ok) {
                throw new Error('Falha ao salvar as alterações no servidor.');
            }

            // Sucesso
            mensagemElement.innerHTML = `<p style="color: green;">Produto atualizado com sucesso!</p>`;
            
            // Opcional: Redirecionar para a página de detalhes após 8 segundos
            setTimeout(() => {
                window.location.href = `detalhe.html?id=${idProdutoSendoEditado}`;
            }, 8000);

        } catch (error) {
            console.error('Erro ao salvar:', error);
            mensagemElement.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
        }
    });
});