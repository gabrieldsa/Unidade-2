/**
 * Este script é executado em todas as páginas do site.
 * Ele espera o DOM (a estrutura HTML) carregar completamente antes de rodar.
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // ========================================================================
    // BLOCO 1: DEFINIÇÃO DE FUNÇÕES AUXILIARES (Helpers)
    // ========================================================================
    // Funções definidas aqui são "ferramentas" reutilizáveis que 
    // serão chamadas pelo BLOCO 2 (Execução Principal).
    // ========================================================================

    // --- 1.1: Funções de Autenticação e Sessão ---

    /**
     * BLOCO 1.1.1:
     * Busca os dados do usuário logado no localStorage.
     * @returns {object | null} - O objeto do usuário (com email e nivel) ou null se não estiver logado.
     */
    const getUserData = () => {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                // Tenta converter a string JSON guardada de volta para um objeto
                return JSON.parse(userData);
            } catch (e) {
                // Se falhar (JSON inválido), limpa o localStorage e retorna null
                console.error("Erro ao parsear dados do usuário:", e);
                localStorage.removeItem('currentUser');
                return null;
            }
        }
        return null; // Retorna null se não houver 'currentUser' no localStorage
    };

    /**
     * BLOCO 1.1.2:
     * Realiza o logout do usuário.
     * Remove o usuário do localStorage e redireciona para a página inicial.
     */
    const logout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html'; 
    };

    // --- 1.2: Funções de Renderização de UI (Interface) ---

    /**
     * BLOCO 1.2.1:
     * Renderiza a barra de navegação dinamicamente.
     * O conteúdo do menu muda dependendo se o usuário está logado
     * e se é 'cliente' ou 'gerente'.
     */
    const renderizarNavbar = () => {
        // Encontra o container do header em qualquer página (index, detalhe, login, etc.)
        const navbarContainer = document.getElementById('navbar-container');
        if (!navbarContainer) return; // Aborta se o elemento <header> não for encontrado

        const user = getUserData(); // Verifica quem está logado
        let navLinks = ''; // String que vai montar o HTML dos links

        // Links visíveis para TODOS (logados ou não)
        navLinks += '<li><a href="index.html">Início</a></li>';
        navLinks += '<li><a href="produtos.html">Produtos</a></li>';
        navLinks += '<li><a href="acessorios.html">Acessórios</a></li>';

        if (user) {
            // --- Usuário está LOGADO ---
            
            // Link visível apenas para 'gerente'
            if (user.nivel === 'gerente') {
                navLinks += '<li><a href="cadastro.html">Cadastrar Produto</a></li>'; 
            }
            
            // Mostra o email/nível e o botão de Sair
            navLinks += `
                <li class="user-info">Olá, ${user.email} (${user.nivel})</li>
                <li><button id="btn-logout" class="btn-logout">Sair</button></li>
            `;
        } else {
            // --- Usuário está DESLOGADO ---
            navLinks += '<li><a href="usuario.html">Cadastre-se</a></li>'; 
            navLinks += '<li><a href="login.html" class="btn-login">Login</a></li>';
        }

        // Constrói o HTML final do header
        navbarContainer.innerHTML = `
            <h1>Loja Gamer</h1>
            <nav>
                <ul>
                    ${navLinks}
                </ul>
            </nav>
        `;

        // Adiciona o "escutador de clique" (click listener) no botão de Sair
        // (Isso só pode ser feito DEPOIS de injetar o HTML acima)
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', logout);
        }
    };

    /**
     * BLOCO 1.2.2:
     * Exibe um modal de confirmação customizado.
     * @param {string} message - A mensagem a ser exibida (ex: "Tem certeza?").
     * @param {function} onConfirm - A função que deve ser executada se o usuário clicar em "Excluir".
     */
    const showCustomConfirmModal = (message, onConfirm) => {
        // Remove qualquer modal anterior para evitar duplicatas
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Cria os elementos do modal dinamicamente
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-confirm">
                <h3>Confirmar Exclusão</h3>
                <p>${message}</p>
                <div class="modal-confirm-actions">
                    <button class="modal-btn-cancel">Cancelar</button>
                    <button class="modal-btn-confirm">Excluir</button>
                </div>
            </div>
        `;

        const btnCancel = overlay.querySelector('.modal-btn-cancel');
        const btnConfirm = overlay.querySelector('.modal-btn-confirm');

        // Função interna para fechar o modal (usada por ambos os botões)
        const closeModal = () => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 200); // 200ms = tempo da animação CSS (fade-out)
        };

        btnCancel.addEventListener('click', closeModal);
        btnConfirm.addEventListener('click', () => {
            onConfirm(); // Executa a ação principal (ex: a exclusão)
            closeModal();
        });

        // Adiciona o modal na página (invisível)
        document.body.appendChild(overlay);
        
        // Adiciona a classe 'visible' para ativar a animação CSS (fade-in)
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    };

    /**
     * BLOCO 1.2.3:
     * Função que encapsula a lógica de exclusão de produto.
     * Ela primeiro chama o modal (BLOCO 1.2.2) e, se confirmado,
     * executa o fetch DELETE.
     */
    const excluirProduto = (id) => {
        
        // 1. Define a função que realmente faz a exclusão (será passada para o modal)
        const executarExclusao = () => {
            fetch(`http://localhost:3000/produtos/${id}`, {
                method: 'DELETE'
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Erro ao tentar excluir o produto no servidor.');
                }
                return; 
            })
            .then(() => {
                // Sucesso: Substitui o conteúdo da página pela mensagem de sucesso
                const detalheElement = document.getElementById("produto-detalhe");
                detalheElement.innerHTML = `
                    <div class="message-success">
                        <h2>Produto removido.</h2>
                        <p>O registro foi excluído com sucesso.</p>
                        <a href="index.html" class="btn-voltar">← Voltar para a lista</a>
                    </div>
                `;
            })
            .catch(error => {
                // Erro: Substitui o conteúdo pela mensagem de erro
                const detalheElement = document.getElementById("produto-detalhe");
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

        // 2. Chama o modal de confirmação
        showCustomConfirmModal(
            `Tem certeza que deseja excluir o produto com ID ${id}?`,
            executarExclusao // Passa a função de exclusão como callback
        );
    };

    /**
     * =======================================================================
     * BLOCO 1.2.4: API DE NOTÍCIAS (AJUSTÁVEL)
     * =======================================================================
     * Esta função busca notícias de uma API externa.
     * Para substituir esta API por outra, basta editar esta função.
     * * O OBJETIVO desta função é retornar uma Promessa (Promise) que 
     * resolve com um array de objetos, onde cada objeto tem a seguinte estrutura:
     * {
     * title: "Título da Notícia",
     * source: "Nome da Fonte",
     * date: "Data da Publicação",
     * link: "URL para a notícia completa"
     * }
     * =======================================================================
     */
    const fetchGamingNews = () => {
        console.log("Buscando notícias (API Real)...");
        
        // --- PASSO 1: Configure sua API Key e URL ---
        // (A API atual é 'newsdata.io')
        const apiKey = "pub_a88d0b3305f0444eb9dfef1c9bfd8db4"; 
        const apiUrl = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=video%20games`; 

        // Verificação de segurança (apenas para depuração)
        if (apiKey === "YOUR_API_KEY") {
            console.error("ERRO: A chave da API de notícias não foi definida.");
            return Promise.reject(new Error("A chave da API (API Key) não foi definida no script.js."));
        }

        // --- PASSO 2: A Chamada da API (fetch) ---
        // Se a sua nova API for diferente, apenas esta parte precisa mudar.
        return fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar notícias da API (A API pode estar offline ou a chave inválida).');
                }
                return response.json(); // Converte a resposta em JSON
            })
            .then(data => {
                // --- PASSO 3: O "Mapeamento" dos Dados ---
                // Esta é a parte mais importante. Você precisa de dizer ao script
                // onde encontrar os dados dentro do JSON que a API retornou.

                // 3a. Encontre o array (lista) de notícias.
                // Na API 'newsdata.io', a lista está em 'data.results'.
                // Em outra API, pode estar em 'data.articles' ou apenas 'data'.
                const listaDeNoticias = data.results; 

                if (!listaDeNoticias) {
                    throw new Error("Formato de resposta da API de notícias inesperado (não encontrou 'data.results').");
                }

                // 3b. Transforme (map) a lista da API para o formato que o nosso site espera.
                return listaDeNoticias.map(item => {
                    // Para cada 'item' na lista da API...
                    return {
                        // O nosso site quer 'title', 'source', 'date', 'link'.
                        // Combine os campos corretos do JSON da API:
                        title: item.title,          // O JSON da API tinha 'title'
                        source: item.source_name,   // O JSON da API tinha 'source_name'
                        date: item.pubDate,         // O JSON da API tinha 'pubDate'
                        link: item.link             // O JSON da API tinha 'link'
                    };
                });
            });
    };
    // =======================================================================
    // FIM DO BLOCO DA API DE NOTÍCIAS
    // =======================================================================


    // ========================================================================
    // BLOCO 2: EXECUÇÃO PRINCIPAL (ROTEADOR DE PÁGINA)
    // ========================================================================

    // --- 2.1: Inicialização Global ---
    const path = window.location.pathname; 
    const currentUser = getUserData(); 
    renderizarNavbar(); 

    // --- 2.2: Lógica Específica da Página de LOGIN (login.html) ---
    if (path.includes("login.html")) {
        // (O código de Login permanece o mesmo)
        const formLogin = document.getElementById('form-login');
        const messageContainer = document.getElementById('message-container');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => {
                e.preventDefault(); 
                const email = document.getElementById('email').value;
                const senha = document.getElementById('senha').value;

                fetch(`http://localhost:3000/usuarios?email=${email}&senha=${senha}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        const user = data[0]; 
                        localStorage.setItem('currentUser', JSON.stringify({
                            email: user.email,
                            nivel: user.nivel
                        }));
                        messageContainer.textContent = 'Login bem-sucedido! Redirecionando...';
                        messageContainer.className = 'success';
                        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                    } else {
                        throw new Error('Email ou senha inválidos.');
                    }
                })
                .catch(err => {
                    messageContainer.textContent = err.message;
                    messageContainer.className = 'error';
                });
            });
        }
    }

    // --- 2.3: Lógica Específica da Página de CADASTRO DE USUÁRIO (usuario.html) ---
    else if (path.includes("usuario.html")) {
        // (O código de Cadastro de Usuário permanece o mesmo)
        const formCadastroUsuario = document.getElementById('form-cadastro-usuario');
        const messageContainer = document.getElementById('message-container');
        if (formCadastroUsuario) {
            formCadastroUsuario.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const senha = document.getElementById('senha').value;
                const nivel = document.getElementById('nivel').value;

                fetch(`http://localhost:3000/usuarios?email=${email}`)
                .then(res => res.json())
                .then(existingUsers => {
                    if (existingUsers.length > 0) {
                        throw new Error('Este email já está cadastrado.');
                    }
                    return fetch('http://localhost:3000/usuarios', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, senha, nivel })
                    });
                })
                .then(res => res.json())
                .then(data => {
                    messageContainer.textContent = 'Cadastro realizado com sucesso! Você já pode fazer o login.';
                    messageContainer.className = 'success';
                    formCadastroUsuario.reset(); 
                    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                })
                .catch(err => {
                    messageContainer.textContent = err.message;
                    messageContainer.className = 'error';
                });
            });
        }
    }

    // --- 2.4: Lógica Específica da Página de CADASTRO DE PRODUTO (cadastro.html) ---
    else if (path.includes("cadastro.html")) {
        // (O código de Cadastro de Produto permanece o mesmo)
        if (!currentUser || currentUser.nivel !== 'gerente') {
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="message-error" style="text-align: center; max-width: 600px; margin: 40px auto;">
                        <h2>Acesso Negado</h2>
                        <p>Você precisa estar logado como 'gerente' para acessar esta página.</p>
                        <a href="index.html" class="btn-voltar">Voltar ao Início</a>
                    </div>
                `;
            }
            return; 
        }
        const formCadastroProduto = document.getElementById('form-cadastro');
        const mensagemElement = document.getElementById('mensagem');
        if (formCadastroProduto) {
            formCadastroProduto.addEventListener('submit', function(e) {
                e.preventDefault();
                const nome = document.getElementById('nome').value.trim();
                const preco = parseFloat(document.getElementById('preco').value);
                const descricao = document.getElementById('descricao').value.trim();
                const imagem = document.getElementById('imagem').value.trim();
                if (!nome || !descricao || isNaN(preco) || preco <= 0 || !imagem) {
                    mensagemElement.innerHTML = '<p style="color: red;">Preencha todos os campos corretamente (Preço deve ser maior que zero).</p>';
                    return;
                }
                mensagemElement.textContent = ''; 
                const novoProduto = { nome, preco, descricao, imagem };
                fetch('http://localhost:3000/produtos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoProduto)
                })
                .then(res => res.json())
                .then(data => {
                    mensagemElement.innerHTML = `<p style="color: green;">Produto <strong>${data.nome}</strong> cadastrado com sucesso!</p>`;
                    formCadastroProduto.reset();
                    setTimeout(() => { mensagemElement.innerHTML = ''; }, 18000);
                })
                .catch(error => {
                    mensagemElement.innerHTML = `<p style="color: red;">${error.message}</p>`;
                });
            });
        }
    }


    // --- 2.5: Lógica Específica das Páginas de LISTAGEM (index.html, produtos.html) ---
    else if (path.includes("index.html") || path.endsWith("/") || path.includes("produtos.html")) {
        
        const isIndex = path.includes("index.html") || path.endsWith("/");
        
        // --- Lógica de Notícias (Apenas para index.html e /) ---
        if (isIndex) {
            const noticiasContainer = document.getElementById('noticias-container');
            if (noticiasContainer) {
                noticiasContainer.innerHTML = "<h2>Últimas Notícias</h2>"; // Título
                
                // [CHAMADA DA API]
                // Chama a função definida no Bloco 1.2.4
                fetchGamingNews() 
                    .then(noticias => { // 'noticias' é o array [{title, source, date, link}, ...]
                        
                        if (!noticias || noticias.length === 0) {
                            throw new Error("A API funcionou, mas não retornou nenhuma notícia.");
                        }

                        // Pega apenas as 3 primeiras notícias
                        noticias.slice(0, 3).forEach(item => {
                            // Cria o elemento <a> (link)
                            const noticiaCard = document.createElement('a');
                            noticiaCard.className = 'noticia-card';
                            noticiaCard.href = item.link; // O link que pegamos da API
                            noticiaCard.target = '_blank'; 
                            noticiaCard.rel = 'noopener noreferrer';
                            
                            // Formata a data para o formato PT-BR (dd/mm/aaaa)
                            const dataFormatada = new Date(item.date).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                            });

                            // Define o HTML interno do link
                            noticiaCard.innerHTML = `
                                <h3>${item.title}</h3>
                                <span>Fonte: ${item.source} - ${dataFormatada}</span>
                            `;
                            noticiasContainer.appendChild(noticiaCard);
                        });
                    })
                    .catch(err => {
                        // Se qualquer parte do Bloco 1.2.4 falhar, este .catch() é ativado
                        console.error("Erro ao buscar notícias:", err.message); 
                        noticiasContainer.innerHTML += `<p style="color: red; text-align: center;">${err.message}</p>`;
                    });
            }
        }
        
        // --- Lógica de Produtos (Modificada para Swiper) ---
        const produtosSection = document.getElementById("produtos");

        if (produtosSection) {
            fetch("http://localhost:3000/produtos")
                .then(res => res.json())
                .then(produtos => {
                    
                    produtosSection.innerHTML = produtos.map(produto => {
                        const cardHTML = `
                            <div class="card">
                                <img src="${produto.imagem}" alt="${produto.nome}">
                                <h2>${produto.nome}</h2>
                                <p>R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</p>
                                <a href="detalhe.html?id=${produto.id}">Ver detalhes</a>
                            </div>
                        `;
                        
                        // Se for a página inicial (isIndex), "embrulha" o card num slide
                        return isIndex ? `<div class="swiper-slide">${cardHTML}</div>` : cardHTML;

                    }).join("");

                    // Se for a página inicial, inicializa o carrossel
                    if (isIndex) {
                        new Swiper('.swiper-container', {
                            loop: true,
                            slidesPerView: 1, // 1 slide em telas pequenas
                            spaceBetween: 20,
                            pagination: {
                                el: '.swiper-pagination',
                                clickable: true,
                            },
                            navigation: {
                                nextEl: '.swiper-button-next',
                                prevEl: '.swiper-button-prev',
                            },
                            // Breakpoints para responsividade
                            breakpoints: {
                                768: { slidesPerView: 2, spaceBetween: 20 },
                                1024: { slidesPerView: 3, spaceBetween: 30 },
                                1200: { slidesPerView: 4, spaceBetween: 30 }
                            }
                        });
                    }
                })
                .catch(err => {
                    console.error("Erro ao carregar produtos:", err);
                    produtosSection.innerHTML = "<p>Erro ao carregar produtos.</p>";
                });
        }
    }

    // --- 2.6: Lógica Específica da Página de DETALHES (detalhe.html) ---
    else if (path.includes("detalhe.html")) {
        // (O código de Detalhes permanece o mesmo)
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
                    let adminButtons = '';
                    if (currentUser && currentUser.nivel === 'gerente') {
                        adminButtons = `
                            <div class="action-buttons">
                                <a href="editar.html?id=${produto.id}" class="btn-editar">Editar</a>
                                <button id="btn-excluir" class="btn-excluir">Excluir Produto</button>
                            </div>
                        `;
                    }
                    detalheElement.innerHTML = `
                        <div class="produto-detalhe-card">
                            <img src="${produto.imagem}" alt="${produto.nome}">
                            <h2>${produto.nome}</h2>
                            <p><strong>Preço:</strong> R$ ${precoFormatado}</p>
                            <p><strong>Descrição:</strong> ${produto.descricao}</p>
                        </div>
                        ${adminButtons} 
                        <a href="index.html" class="btn-voltar">← Voltar para a lista</a>
                    `;
                    const btnExcluir = document.getElementById('btn-excluir');
                    if (btnExcluir) {
                        btnExcluir.addEventListener('click', () => {
                            excluirProduto(parseInt(produtoId));
                        });
                    }
                })
                .catch(error => {
                    console.error("Erro ao buscar detalhes:", error);
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

    // --- 2.7: Lógica Específica da Página de EDIÇÃO (editar.html) ---
    else if (path.includes("editar.html")) {
        // (O código de Edição permanece o mesmo)
        if (!currentUser || currentUser.nivel !== 'gerente') {
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="message-error" style="text-align: center; max-width: 600px; margin: 40px auto;">
                        <h2>Acesso Negado</h2>
                        <p>Você precisa estar logado como 'gerente' para acessar esta página.</p>
                        <a href="index.html" class="btn-voltar">Voltar ao Início</a>
                    </div>
                `;
            }
            return; 
        }
        const formEditar = document.getElementById('form-editar');
        const mensagemElement = document.getElementById('mensagem');
        const urlParams = new URLSearchParams(window.location.search);
        const produtoId = urlParams.get("id");
        const nomeInput = document.getElementById('nome');
        const precoInput = document.getElementById('preco');
        const descricaoInput = document.getElementById('descricao');
        const imagemInput = document.getElementById('imagem');

        if (!produtoId) {
            document.querySelector('main').innerHTML = `<div class="message-error">ID do produto não fornecido.</div>`;
            return;
        }

        fetch(`http://localhost:3000/produtos/${produtoId}`)
            .then(res => {
                if (!res.ok) { throw new Error('Produto não encontrado.'); }
                return res.json();
            })
            .then(produto => {
                nomeInput.value = produto.nome;
                precoInput.value = produto.preco;
                descricaoInput.value = produto.descricao;
                imagemInput.value = produto.imagem;
            })
            .catch(error => {
                mensagemElement.innerHTML = `<p style="color: red;">${error.message}</p>`;
            });

        if (formEditar) {
            formEditar.addEventListener('submit', (e) => {
                e.preventDefault();
                const produtoAtualizado = {
                    nome: nomeInput.value.trim(),
                    preco: parseFloat(precoInput.value),
                    descricao: descricaoInput.value.trim(),
                    imagem: imagemInput.value.trim()
                };
                if (!produtoAtualizado.nome || !produtoAtualizado.descricao || isNaN(produtoAtualizado.preco) || produtoAtualizado.preco <= 0 || !produtoAtualizado.imagem) {
                    mensagemElement.innerHTML = '<p style="color: red;">Preencha todos os campos corretamente.</p>';
                    return;
                }
                fetch(`http://localhost:3000/produtos/${produtoId}`, {
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(produtoAtualizado)
                })
                .then(res => {
                    if (!res.ok) { throw new Error('Erro ao salvar as alterações.'); }
                    return res.json();
                })
                .then(data => {
                    mensagemElement.innerHTML = `<p style="color: green;">Produto <strong>${data.nome}</strong> salvo com sucesso!</p>`;
                    setTimeout(() => {
                        window.location.href = `detalhe.html?id=${produtoId}`;
                    }, 2000);
                })
                .catch(error => {
                    mensagemElement.innerHTML = `<p style="color: red;">${error.message}</p>`;
                });
            });
        }
    }

});

