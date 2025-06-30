// /static/js/aluno.js (versão refatorada)

import { fetchMeusDados, fetchMyCheckins, doCheckin, updateMyData, updateMyPassword, updateMyPhoto, fetchHorarios, fetchBiblioteca } from './apiService.js';
import { getAuthToken, getUserPermissao, clearAuthData } from './auth.js';
import { showMessage, setupTabs, formatarTelefone } from './ui.js';
import { renderizarGradeDeHorarios, renderizarBibliotecaKatas } from './components.js';

let kataModal, modalKataTitle, modalKataBody, modalKataCloseBtn;

document.addEventListener('DOMContentLoaded', initializePage);

function initializePage() {
    // Proteção de Rota
    if (!getAuthToken() || getUserPermissao() === 'admin') {
        clearAuthData();
        window.location.href = '/login.html';
        return;
    }

    setupEventListeners();
    loadInitialData();
}

function setupEventListeners() {
    document.getElementById('btnLogout').addEventListener('click', () => {
        clearAuthData();
        window.location.href = '/login.html';
    });
    
    setupTabs(); // Configura a navegação por abas

    document.getElementById('btnCheckin').addEventListener('click', handleCheckin);
    document.getElementById('formEditarDados').addEventListener('submit', handleUpdateData);
    document.getElementById('editTelefone').addEventListener('input', formatarTelefone);
    document.getElementById('formAlterarFoto').addEventListener('submit', handleUpdatePhoto);
    document.getElementById('formAlterarSenha').addEventListener('submit', handleUpdatePassword);

    kataModal = document.getElementById('kataModal');
    modalKataTitle = document.getElementById('modalKataTitle');
    modalKataBody = document.getElementById('modalKataBody');
    modalKataCloseBtn = document.getElementById('modalKataCloseBtn');

    modalKataCloseBtn.addEventListener('click', closeKataModal);
    kataModal.addEventListener('click', (e) => {
        // Fecha se clicar no fundo escuro
        if (e.target === kataModal) {
            closeKataModal();
        }
    });
}

async function loadInitialData() {
    try {
        // Usamos Promise.all para carregar dados em paralelo, o que é mais rápido
        const [aluno, checkins, horarios, biblioteca] = await Promise.all([
            fetchMeusDados(),
            fetchMyCheckins(),
            fetchHorarios(),
            fetchBiblioteca()
        ]);

        populateAlunoData(aluno);
        populateCheckins(checkins);
        renderizarGradeDeHorarios(document.getElementById('gradeHorariosAluno'), horarios, false);
        renderizarBibliotecaKatas(document.getElementById('bibliotecaContainer'), biblioteca, openKataModal);

    } catch (error) {
        showMessage(error.message, 'error');
        // Se houver um erro grave (ex: token inválido), desloga o usuário
        setTimeout(() => {
            clearAuthData();
            window.location.href = '/login.html';
        }, 2000);
    }
}

// --- Funções do Modal ---

function openKataModal(item) {
    modalKataTitle.textContent = item.titulo || item.nome || `Grau ${item.grau}`;
    modalKataBody.innerHTML = '';
    
    if (item.grupos && item.grupos.length > 0) {
        // --- LÓGICA DE ORDENAÇÃO ADICIONADA AQUI ---
        // 1. Define a ordem desejada dos grupos
        const ordemDosGrupos = [
            'Ataque',
            'Defesa',
            'Queda e/ou parte em pé',
            'Postura/Comportamento/Educativo',
            'Posições/Golpes',
            'Defesa pessoal',
            'Teoria'
        ];

        // 2. Cria uma cópia e ordena o array de grupos com base na lista acima
        const gruposOrdenados = [...item.grupos].sort((a, b) => {
            const indexA = ordemDosGrupos.indexOf(a.nome);
            const indexB = ordemDosGrupos.indexOf(b.nome);
            
            // Grupos não listados vão para o final
            const finalIndexA = indexA === -1 ? Infinity : indexA;
            const finalIndexB = indexB === -1 ? Infinity : indexB;

            return finalIndexA - finalIndexB;
        });
        // --- FIM DA LÓGICA DE ORDENAÇÃO ---

        // 3. Itera sobre o array JÁ ORDENADO para criar o HTML
        gruposOrdenados.forEach(grupo => {
            const grupoTitle = document.createElement('h5');
            grupoTitle.className = 'kata-grupo-title';
            grupoTitle.textContent = grupo.nome;
            modalKataBody.appendChild(grupoTitle);
            
            grupo.posicoes.forEach(posicao => {
                const posItem = document.createElement('div');
                posItem.className = 'kata-posicao-item';
                if (posicao.video_url) {
                     posItem.innerHTML = `<a href="${posicao.video_url}" target="_blank" title="Ver vídeo da técnica"><i class="fas fa-video"></i> ${posicao.nome}</a>`;
                } else {
                     posItem.innerHTML = `<span><i class="fas fa-dot-circle"></i> ${posicao.nome}</span>`;
                }
                modalKataBody.appendChild(posItem);
            });
        });
    } else {
        modalKataBody.innerHTML = '<p>Nenhuma posição cadastrada para este item.</p>';
    }
    kataModal.style.display = 'block';
}

function closeKataModal() {
    kataModal.style.display = 'none';
}

function populateAlunoData(aluno) {
    document.getElementById('nomeAluno').textContent = aluno.nome;
    document.getElementById('alunoPlano').textContent = aluno.plano;
    document.getElementById('alunoFaixa').textContent = aluno.faixa;
    document.getElementById('alunoGrau').textContent = aluno.grau;
    document.getElementById('alunoEmail').textContent = aluno.email;
    document.getElementById('alunoTelefone').textContent = aluno.telefone;
    document.getElementById('editTelefone').value = aluno.telefone;
    
    const dataNasc = new Date(aluno.dataNascimento);
    document.getElementById('alunoDataNascimento').textContent = dataNasc.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    
    if (aluno.foto_path) {
        document.getElementById('alunoFotoHeader').src = '/' + aluno.foto_path.replace(/\\/g, '/');
    }
}

function populateCheckins(checkins) {
    const lista = document.getElementById('listaCheckins');
    lista.innerHTML = '';
    if (checkins.length === 0) {
        lista.innerHTML = '<li>Você ainda não possui check-ins registrados.</li>';
        return;
    }
    checkins.forEach(checkin => {
        const item = document.createElement('li');
        const dataFormatada = new Date(checkin.data_checkin).toLocaleString('pt-BR');
        item.textContent = `Presença registrada em: ${dataFormatada}`;
        lista.appendChild(item);
    });
}

// --- Funções de Evento (Handlers) ---

async function handleCheckin(e) {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Processando...';
    try {
        const data = await doCheckin();
        showMessage(data.message, 'success');
        btn.textContent = 'Check-in de Hoje Realizado!';
        loadInitialData(); // Recarrega os dados para atualizar a lista
    } catch (error) {
        showMessage(error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Fazer Check-in de Hoje';
    }
}

async function handleUpdateData(e) {
    e.preventDefault();
    const telefone = e.target.editTelefone.value;
    try {
        const data = await updateMyData({ telefone });
        showMessage(data.message, 'success');
        document.getElementById('alunoTelefone').textContent = telefone;
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleUpdatePhoto(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    try {
        const data = await updateMyPhoto(formData);
        showMessage(data.message, 'success');
        document.getElementById('alunoFotoHeader').src = '/' + data.foto_path.replace(/\\/g, '/');
        form.reset();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleUpdatePassword(e) {
    e.preventDefault();
    const form = e.target;
    const senhaAntiga = form.senhaAntiga.value;
    const novaSenha = form.novaSenha.value;
    const confirmarNovaSenha = form.confirmarNovaSenha.value;

    if (novaSenha !== confirmarNovaSenha) {
        showMessage('A nova senha e a confirmação não são iguais.', 'error');
        return;
    }
    
    try {
        const data = await updateMyPassword(senhaAntiga, novaSenha);
        showMessage(data.message, 'success');
        form.reset();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}