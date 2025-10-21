document.addEventListener("DOMContentLoaded", () => {
    // Detecta a página atual
    const path = window.location.pathname;

    // Função para lidar com a exclusão
    const excluirProduto = (id) => {
        // Usa 'confirm' para pedir confirmação ao usuário
        if (!confirm(`Tem certeza que deseja excluir o produto com ID ${id}?`)) {
            return; // Sai da função se o usuário cancelar
        }

        fetch(`http://localhost:3000/produtos/${id}`, {
            method: 'DELETE'
        })
        .then(res => {
            // Se o status NÃO for 200 OK (ex: 404 ou 500), lança o erro.
            if (!res.ok) {
                throw new Error('Erro ao tentar excluir o produto no servidor.');
            }
            return; 
        })
        .then(() => {
            const detalheElement = document.getElementById("produto-detalhe");
            
            // Lógica de SUCESSO: Exibe mensagem e botão Voltar.
            detalheElement.innerHTML = `
                <div class="message-success">
                    <h2>Produto removido.</h2>
                    <p>O registro foi excluído com sucesso.</p>
                    <a href="index.html" class="btn-voltar">← Voltar para a lista</a>
                </div>
            `;

        })
        .catch(error => {
            const detalheElement = document.getElementById("produto-detalhe");
            // Lógica de ERRO: Exibe a mensagem de falha e botão Voltar.
            detalheElement.innerHTML = `
                <div class="message-error">
                    <h2>Erro na Operação</h2>
                    <p>${error.message}</p>
                    <a href="index.html" class="btn-voltar error">← Voltar</a>
                </div>
            `;
            console.error("Erro na exclusão:", error);
        });
    };

    // -------------------------------
    // LÓGICA DA PÁGINA PRINCIPAL (INDEX)
    // -------------------------------
    if (path.includes("index.html") || path.endsWith("/")) {
        const produtosSection = document.getElementById("produtos");

        // Busca os produtos e renderiza os cards
        fetch("http://localhost:3000/produtos")
            .then(res => res.json())
            .then(produtos => {
                produtosSection.innerHTML = produtos.map(produto => `
                    <div class="card">
                        <img src="${produto.imagem}" alt="${produto.nome}">
                        <h2>${produto.nome}</h2>
                        <p>R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</p>
                        <a href="detalhe.html?id=${produto.id}">Ver detalhes</a>
                    </div>
                `).join("");
            })
            .catch(err => {
                console.error("Erro ao carregar produtos:", err);
                produtosSection.innerHTML = "<p>Erro ao carregar produtos.</p>";
            });
    }

    // -------------------------------
    // LÓGICA DA PÁGINA DE DETALHES
    // -------------------------------
    if (path.includes("detalhe.html")) {
        const detalheElement = document.getElementById("produto-detalhe");
        const urlParams = new URLSearchParams(window.location.search);
        const produtoId = urlParams.get("id");

        if (produtoId) {
            fetch(`http://localhost:3000/produtos/${produtoId}`)
                .then(res => {
                    if (res.status === 404) throw new Error("Produto não encontrado");
                    return res.json();
                })
                .then(produto => {
                    const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ',');
                    detalheElement.innerHTML = `
                        <div class="produto-detalhe-card">
                            <img src="${produto.imagem}" alt="${produto.nome}">
                            <h2>${produto.nome}</h2>
                            <p><strong>Preço:</strong> R$ ${precoFormatado}</p>
                            <p><strong>Descrição:</strong> ${produto.descricao}</p>
                        </div>
                        <div class="action-buttons">
                            <!-- NOVO BOTÃO DE EDIÇÃO -->
                            <a href="editar.html?id=${produto.id}" class="btn-editar">Editar</a>

                            <button id="btn-excluir" class="btn-excluir">Excluir Produto</button>
                        </div>
                        <a href="index.html" class="btn-voltar">← Voltar para a lista</a>
                    `;
                    
                    // Adiciona o listener APÓS o botão ser injetado no DOM
                    document.getElementById('btn-excluir').addEventListener('click', () => {
                        excluirProduto(parseInt(produtoId));
                    });

                })
                .catch(error => {
                    console.error("Erro ao buscar detalhes:", error);
                    // Aqui usamos o fluxo de erro mais limpo para carregar o produto
                    detalheElement.innerHTML = `
                        <div class="message-error">
                            <h2>Erro ao Carregar Produto</h2>
                            <p>${error.message}</p>
                            <a href="index.html" class="btn-voltar error">← Voltar</a>
                        </div>
                    `;
                });
        } else {
            detalheElement.innerHTML = "<p>Produto não especificado.</p>";
        }
    }
});