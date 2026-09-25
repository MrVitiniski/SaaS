// js/login_admin.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login-admin');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const dadosLogin = {
                email: document.getElementById('admin-email').value,
                senha: document.getElementById('admin-senha').value
            };

            try {
                const resposta = await fetch('http://localhost:8080/saas/api/login_admin.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dadosLogin)
                });

                const resultado = await resposta.json();

                if (resultado.erro) {
                    alert(resultado.erro);
                } else if (resultado.sucesso) {
                    alert(resultado.mensagem);
                    // Redireciona direto para o painel administrativo da empresa correspondente
                    window.location.href = "admin_dashboard.html";
                }

            } catch (erro) {
                console.error("Erro na autenticação:", erro);
                alert("Não foi possível conectar ao servidor administrativo.");
            }
        });
    }
});
