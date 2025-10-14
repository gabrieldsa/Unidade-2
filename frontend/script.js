document.addEventListener("DOMContentLoaded", () => {
    // Detecta a página atual
    const path = window.location.pathname;

    // -------------------------------
    // LÓGICA DA PÁGINA PRINCIPAL
    // -------------------------------
    if (path.includes("index.html") || path.endsWith("/")) {
        const produtosSection = document.getElementById("produtos");

        // Exemplo: busca os produtos e exibe na tela
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
                    `;
                })
                .catch(error => {
                    console.error("Erro ao buscar detalhes:", error);
                    detalheElement.innerHTML = "<p>Produto não encontrado ou erro de conexão.</p>";
                });
        } else {
            detalheElement.innerHTML = "<p>Produto não especificado.</p>";
        }
    }
});
