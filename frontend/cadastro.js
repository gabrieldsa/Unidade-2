document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');
    const mensagemElement = document.getElementById('mensagem');

    if (formCadastro) {
        formCadastro.addEventListener('submit', function(e) {
            e.preventDefault();

            // 1. COLETAR DADOS E ELEMENTOS
            const nome = document.getElementById('nome').value.trim();
            const preco = parseFloat(document.getElementById('preco').value);
            const descricao = document.getElementById('descricao').value.trim();
            const imagem = document.getElementById('imagem').value.trim();
            
            // 2. VALIDAÇÃO DO FORMULÁRIO (FRONT-END)
            // Verifica se campos essenciais estão vazios, se o preço não é um número, ou se é <= 0.
            if (!nome || !descricao || isNaN(preco) || preco <= 0 || !imagem) {
                mensagemElement.textContent = 'Preencha todos os campos corretamente (Preço deve ser maior que zero).';
                mensagemElement.style.color = 'red';
                return; // Bloqueia o envio se houver erro de validação
            }
            
            // Limpa a mensagem de erro anterior
            mensagemElement.textContent = ''; 

            const novoProduto = {
                nome: nome,
                preco: preco,
                descricao: descricao,
                imagem: imagem
            };

            // 3. ENVIO VIA FETCH (POST)
            fetch('http://localhost:3000/produtos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novoProduto)
            })
            .then(res => {
                if (!res.ok) {
                    // Lança um erro se o servidor retornar um status HTTP ruim
                    throw new Error('Erro ao cadastrar produto. Verifique se o servidor Node.js está rodando.');
                }
                return res.json();
            })
            .then(data => {
                // Sucesso: Exibe mensagem e limpa o formulário
                mensagemElement.innerHTML = `<p style="color: green;">Produto <strong>${data.nome}</strong> cadastrado com sucesso!</p>`;
                formCadastro.reset();
                
                // AJUSTE: Limpa a mensagem após 18 segundos
                setTimeout(() => {
                    mensagemElement.innerHTML = '';
                }, 18000); // 18000 milissegundos = 18 segundos
                
            })
            .catch(error => {
                // Trata erros de rede ou de servidor
                mensagemElement.innerHTML = `<p style="color: red;">${error.message}</p>`;
            });
        });
    }
});