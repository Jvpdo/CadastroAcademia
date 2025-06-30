// /static/js/login.js (versão refatorada)

import { loginUser } from './apiService.js';
import { saveAuthData } from './auth.js';
import { showMessage } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value;
    const senha = form.senha.value;
    const submitButton = form.querySelector('button[type="submit"]');

    // Desabilita o botão para evitar cliques múltiplos
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...';

    try {
        // 1. A chamada à API agora é uma única função clara
        const data = await loginUser(email, senha);

        // 2. A lógica de salvar no localStorage também é uma função
        saveAuthData(data.token, data.permissao);
        
        showMessage('Login realizado com sucesso! Redirecionando...');

        // 3. Redireciona com base na permissão
        setTimeout(() => {
            if (data.permissao === 'admin') {
                window.location.href = '/index.html'; // Painel do Admin
            } else {
                window.location.href = '/aluno.html'; // Painel do Aluno
            }
        }, 1500);

    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        // Reabilita o botão, independentemente do resultado
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
    }
}