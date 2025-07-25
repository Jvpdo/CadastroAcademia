// /static/js/admin.js (versão refatorada)

import * as api from './apiService.js';
import * as auth from './auth.js';
import { showMessage, setupTabs, formatarTelefone } from './ui.js';
import { renderizarGradeDeHorarios, renderizarListaKatasAdmin } from './components.js';

// --- State Management ---
// Um objeto simples para guardar o estado da página
let state = {
    selectedAlunoId: null,
     // Novo estado para o modal de histórico
    historyCurrentPage: 1,
    historySearchDate: '',
};

// --- DOM Element Caching ---
// Buscamos os elementos uma vez para evitar buscas repetidas no DOM
const elements = {
    studentForm: document.getElementById('studentForm'),
    studentTableBody: document.getElementById('tabelaEstudantes'),
    searchInput: document.getElementById('inputNome'),
    searchButton: document.getElementById('btnProcurar'),
    
    // Modal elements
    modal: document.getElementById('myModal'),
    modalCloseBtn: document.getElementById('btnCloseModal'),
    modalUpdateBtn: document.getElementById('btnAtualizar'),
    modalDeleteBtn: document.getElementById('btnDeletar'),
    modalBody: document.querySelector('.modal-body'),
    btnAbrirHistorico: document.getElementById('btnAbrirHistorico'),
    formAddCheckin: document.getElementById('formAddCheckin'),

    // Novos elementos do modal de histórico
    historyModal: document.getElementById('historyModal'),
    historyModalTitle: document.getElementById('historyModalTitle'),
    historyModalBody: document.getElementById('historyModalBody'),
    historyModalCloseBtn: document.getElementById('historyModalCloseBtn'),
    historyCheckinList: document.getElementById('historyCheckinList'),
    historySearchDateInput: document.getElementById('historySearchDate'),
    historySearchBtn: document.getElementById('historySearchBtn'),
    historyClearBtn: document.getElementById('historyClearBtn'),
    historyPrevBtn: document.getElementById('historyPrevBtn'),
    historyNextBtn: document.getElementById('historyNextBtn'),
    historyPageInfo: document.getElementById('historyPageInfo'),
    
    // Schedule elements
    scheduleForm: document.getElementById('formHorario'),
    scheduleGrid: document.getElementById('gradeHorariosAdmin'),

    // Kata elements
    kataForm: document.getElementById('formKata'),
    kataListContainer: document.getElementById('listaKatasAdmin'),
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', initializePage);

function initializePage() {
    // Proteção de Rota
    if (!auth.isLoggedIn() || auth.getUserPermissao() !== 'admin') {
        auth.clearAuthData();
        window.location.href = '/login.html';
        return;
    }

    setupTabs();
    setupEventListeners();
    loadInitialData();
}

function setupEventListeners() {
    //LOGOUT
    document.getElementById('btnLogout').addEventListener('click', () => {
        auth.clearAuthData(); // Usa nosso módulo de autenticação
        window.location.href = '/login.html';
    });

    // --- ADICIONE ESTE BLOCO PARA O BOTÃO "OLHO" ---
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('senhaCadastro');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            // Verifica o tipo do input e troca entre 'password' e 'text'
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Troca o ícone do olho
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Alunos
    elements.studentForm.addEventListener('submit', handleCreateStudent);
    const telefoneInput = elements.studentForm.querySelector('#telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', formatarTelefone);
    }
    elements.searchButton.addEventListener('click', handleSearchStudents);
    elements.studentTableBody.addEventListener('click', handleTableClick); // Event Delegation

    // Modal
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => { if(e.target === elements.modal) closeModal(); }); // Fechar ao clicar fora
    elements.modalUpdateBtn.addEventListener('click', handleUpdateAluno);
    elements.modalDeleteBtn.addEventListener('click', handleDeleteAluno);
    elements.modalBody.addEventListener('click', handleModalEditClick);
    elements.btnAbrirHistorico.addEventListener('click', () => {
        if (state.selectedAlunoId) openHistoryModal();
    });
    elements.formAddCheckin.addEventListener('submit', handleAddCheckin);

    
    // Listeners para o novo modal de histórico
    elements.historyModalCloseBtn.addEventListener('click', closeHistoryModal);
    elements.historyCheckinList.addEventListener('click', handleDeleteCheckinInHistory); // Delegação de evento
    elements.historySearchBtn.addEventListener('click', handleHistorySearch);
    elements.historyClearBtn.addEventListener('click', handleHistoryClear);
    elements.historyPrevBtn.addEventListener('click', handleHistoryPrevPage);
    elements.historyNextBtn.addEventListener('click', handleHistoryNextPage);

    // Horários
    elements.scheduleForm.addEventListener('submit', handleCreateHorario);
    elements.scheduleGrid.addEventListener('click', handleDeleteHorario); // Event Delegation

    // Katas
    elements.kataForm.addEventListener('submit', handleCreateKataPosicao);
    elements.kataListContainer.addEventListener('click', handleDeleteKataPosicao); // Event Delegation

    
}

async function loadInitialData() {
    try {
        // Carregamos os dados principais em paralelo
        await Promise.all([
            handleSearchStudents(),
            loadHorarios(),
            loadKatas(),
            loadPresencaDoDia()
        ]);
        
        // Buscamos os dados para o formulário de katas e chamamos a função para preencher
        const kataData = await api.fetchKataAdminData();
        populateKataFormSelects(kataData); // <--- LINHA ADICIONADA

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

 async function loadPresencaDoDia() {
    try {
        const presencas = await api.fetchPresencaDoDia();
        const tabelaBody = document.getElementById('tabelaPresenca');
        tabelaBody.innerHTML = ''; // Limpa a tabela

        if (presencas.length === 0) {
            const row = tabelaBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 3;
            cell.textContent = 'Nenhum check-in registrado hoje.';
            cell.style.textAlign = 'center';
            return;
        }

        presencas.forEach(presenca => {
            const row = tabelaBody.insertRow();
            const fotoCell = row.insertCell(0);
            const nomeCell = row.insertCell(1);
            const horaCell = row.insertCell(2);

            const fotoImg = document.createElement('img');
            fotoImg.src = presenca.foto_path ? `/${presenca.foto_path.replace(/\\/g, '/')}` : '/static/imagens/placeholder.png';
            fotoImg.alt = `Foto de ${presenca.nome}`;
            fotoImg.className = 'foto-presenca';
            fotoCell.appendChild(fotoImg);

            nomeCell.textContent = presenca.nome;
            horaCell.textContent = new Date(presenca.data_checkin).toLocaleTimeString('pt-BR');
        });

    } catch (error) {
        ui.showMessage(error.message, 'error');
    }
}

// --- Student Handlers ---
async function handleCreateStudent(e) {
    e.preventDefault();
    const formData = new FormData(elements.studentForm);
    try {
        const data = await api.createAluno(formData);
        showMessage(data.message || 'Aluno criado com sucesso!', 'success');
        elements.studentForm.reset();
        handleSearchStudents();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleSearchStudents() {
    const nome = elements.searchInput.value;
    try {
        const alunos = await api.fetchAlunos(nome);
        elements.studentTableBody.innerHTML = ''; // Limpa a tabela
        alunos.forEach(aluno => {
            const row = elements.studentTableBody.insertRow();
            row.dataset.alunoId = aluno.id; // Adiciona o ID ao 'data' attribute da linha
            row.insertCell(0).innerText = aluno.id;
            row.insertCell(1).innerText = aluno.nome;
        });
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function openModalWithStudentData(alunoId) {
    try {
        const { data: aluno } = await api.fetchAlunoById(alunoId);

        state.selectedAlunoId = aluno.id;
        
        // --- 1. PREENCHIMENTO DOS DADOS ---
        // Preenche os spans de visualização
        document.getElementById('alunoId').textContent = aluno.id || 'N/A';
        document.getElementById('alunoNome').textContent = aluno.nome || 'N/A';
        document.getElementById('alunoEmail').textContent = aluno.email || 'N/A';
        document.getElementById('alunoTelefone').textContent = aluno.telefone || 'N/A';
        document.getElementById('alunoSexo').textContent = aluno.sexo || 'N/A';
        document.getElementById('alunoFaixa').textContent = aluno.faixa || 'N/A';
        document.getElementById('alunoGrau').textContent = aluno.grau || 'N/A';
        document.getElementById('alunoPlano').textContent = aluno.plano || 'N/A';
        document.getElementById('alunoIdade').textContent = aluno.dataNascimento ? calcularIdade(aluno.dataNascimento) : 'N/A';
        
        // Preenche os campos de edição (que ficam escondidos)
        document.getElementById('editNome').value = aluno.nome || '';
        document.getElementById('editEmail').value = aluno.email || '';
        document.getElementById('editTelefone').value = aluno.telefone || '';
        document.getElementById('editSexo').value = aluno.sexo || '';
        document.getElementById('editFaixa').value = aluno.faixa || '';
        document.getElementById('editGrau').value = aluno.grau || '';
        document.getElementById('editPlano').value = aluno.plano || '';
        document.getElementById('editDataNascimentoHidden').value = aluno.dataNascimento || '';
        document.getElementById('editDataNascimento').value = aluno.dataNascimento ? aluno.dataNascimento.split('T')[0] : '';


        // --- 2. PREENCHIMENTO DA FOTO ---
        const alunoFotoElement = document.getElementById('alunoFoto');
        if (aluno.foto_path) {
            alunoFotoElement.src = '/' + aluno.foto_path.replace(/\\/g, '/');
            alunoFotoElement.style.display = 'block';
        } else {
            alunoFotoElement.src = '';
            alunoFotoElement.style.display = 'none';
        }

elements.modal.style.display = 'block';

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

    function handleTableClick(e) {
    const row = e.target.closest('tr');
    if (row && row.dataset.alunoId) {
        openModalWithStudentData(row.dataset.alunoId);
    }
}

    function handleModalEditClick(e) {
    if (!e.target.classList.contains('fa-edit')) return;
    const icon = e.target;
    const parentDiv = icon.parentElement;
    const viewField = parentDiv.querySelector('span');
    const editField = parentDiv.querySelector('input, select');
    if (!viewField || !editField) return;
    if (editField.style.display === 'none' || editField.style.display === '') {
        editField.style.display = 'inline';
        viewField.style.display = 'none';
    } else {
        editField.style.display = 'none';
        viewField.style.display = 'inline';
        if (editField.tagName !== 'SELECT') {
            viewField.textContent = editField.value;
        } else {
            viewField.textContent = editField.options[editField.selectedIndex].text;
        }
    }
}

    function closeModal() {
    elements.modal.style.display = 'none';
    state.selectedAlunoId = null;
}

    async function handleUpdateAluno() {
    if (!state.selectedAlunoId) return;
    const dataNascimentoInput = document.getElementById("editDataNascimento").value || document.getElementById("editDataNascimentoHidden").value;
    const dadosAtualizados = {
        nome: document.getElementById("editNome").value,
        email: document.getElementById("editEmail").value,
        telefone: document.getElementById("editTelefone").value,
        sexo: document.getElementById("editSexo").value,
        dataNascimento: dataNascimentoInput,
        faixa: document.getElementById("editFaixa").value,
        grau: document.getElementById("editGrau").value,
        plano: document.getElementById("editPlano").value,
    };

    try {
        const data = await api.updateAluno(state.selectedAlunoId, dadosAtualizados);
        showMessage(data.message, 'success');
        closeModal();
        handleSearchStudents();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleDeleteAluno() {
    if (!state.selectedAlunoId) return;
    if (confirm(`Tem certeza que deseja deletar o aluno ID ${state.selectedAlunoId}?`)) {
        try {
            const data = await api.deleteAluno(state.selectedAlunoId);
            showMessage(data.message, 'success');
            closeModal();
            handleSearchStudents();
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }
}

    // ---- Botão de adicionar e deletar check-in
    async function handleAddCheckin(e) {
    e.preventDefault();
    const form = e.target;
    const checkinDate = form.querySelector('#checkinDate').value;

    if (!checkinDate || !state.selectedAlunoId) {
        showMessage('Por favor, selecione uma data e um aluno.', 'error');
        return;
    }

    try {
        await api.createManualCheckin(state.selectedAlunoId, checkinDate);
        showMessage('Check-in adicionado com sucesso!', 'success');
        form.reset();
        // Se o modal de histórico estiver aberto, atualiza ele.
        if (elements.historyModal.style.display === 'block') {
            openHistoryModal(state.historyCurrentPage, state.historySearchDate);
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleDeleteCheckinInHistory(e) {
    if (!e.target.classList.contains('btn-delete-checkin')) return;
    const checkinId = e.target.dataset.id;
    if (confirm(`Tem certeza que deseja deletar este registro de check-in?`)) {
        try {
            await api.deleteCheckin(checkinId);
            showMessage('Check-in deletado com sucesso.', 'success');
            // Recarrega a página atual do histórico para mostrar a remoção.
            openHistoryModal(state.historyCurrentPage, state.historySearchDate);
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }
}

    // --- NOVAS FUNÇÕES PARA O MODAL DE HISTÓRICO ---

async function openHistoryModal(page = 1, date = '') {
    if (!state.selectedAlunoId) return;

    state.historyCurrentPage = page;
    state.historySearchDate = date;
    elements.historySearchDateInput.value = date;

    try {
        const data = await api.fetchCheckinHistory(state.selectedAlunoId, page, date);
        const { checkins, pagination } = data;

        elements.historyCheckinList.innerHTML = '';
        if (checkins.length === 0) {
            elements.historyCheckinList.innerHTML = '<li>Nenhum resultado encontrado.</li>';
        } else {
            checkins.forEach(checkin => {
                const item = document.createElement('li');
                item.innerHTML = `
                    <span>${new Date(checkin.data_checkin).toLocaleString('pt-BR')}</span>
                    <button class="btn-delete-checkin" data-id="${checkin.id}" title="Deletar">&times;</button>
                `;
                elements.historyCheckinList.appendChild(item);
            });
        }
        
        elements.historyPageInfo.textContent = `Página ${pagination.currentPage || 1} de ${pagination.totalPages || 1}`;
        elements.historyPrevBtn.disabled = pagination.currentPage <= 1;
        elements.historyNextBtn.disabled = pagination.currentPage >= pagination.totalPages;

        elements.historyModal.style.display = 'block';
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function closeHistoryModal() {
    elements.historyModal.style.display = 'none';
}

function handleHistorySearch() {
    const date = elements.historySearchDateInput.value;
    openHistoryModal(1, date);
}

function handleHistoryClear() {
    openHistoryModal(1, '');
}

function handleHistoryPrevPage() {
    openHistoryModal(state.historyCurrentPage - 1, state.historySearchDate);
}

function handleHistoryNextPage() {
    openHistoryModal(state.historyCurrentPage + 1, state.historySearchDate);
}

// --- FUNÇÃO CALCULAR IDADE ---
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

/**
 * Popula os campos <select> do formulário de katas com dados da API.
 * @param {object} kataData - O objeto contendo as listas de faixas e grupos.
 */
function populateKataFormSelects(kataData) {
    const kataFaixaSelect = document.getElementById('kataFaixa');
    const kataGrupoSelect = document.getElementById('kataGrupo');

    if (!kataFaixaSelect || !kataGrupoSelect) return;

    // Limpa as opções "Carregando..." e popula as faixas
    kataFaixaSelect.innerHTML = '<option value="">Selecione uma faixa</option>';
    kataData.faixas.forEach(faixa => {
        const option = new Option(faixa.nome_faixa, faixa.id);
        kataFaixaSelect.add(option);
    });

    // Limpa as opções "Carregando..." e popula os grupos
    kataGrupoSelect.innerHTML = '<option value="">Selecione um grupo</option>';
    kataData.grupos.forEach(grupo => {
        const option = new Option(grupo.nome_grupo, grupo.id);
        kataGrupoSelect.add(option);
    });
}

// --- Schedule Handlers ---
async function loadHorarios() {
    try {
        
        const horarios = await api.fetchHorarios();
        renderizarGradeDeHorarios(elements.scheduleGrid, horarios, true); // Correto!
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleCreateHorario(e) { 
    e.preventDefault(); 
    
    const form = e.target;
    const dadosHorario = {
        dia_semana: form.dia_semana.value,
        horario_inicio: form.horario_inicio.value,
        horario_fim: form.horario_fim.value,
        descricao: form.descricao.value,
    };

    try {
        const data = await api.createHorario(dadosHorario);
        showMessage(data.message, 'success');
        form.reset(); // Limpa o formulário
        loadHorarios(); // Atualiza a grade de horários na tela
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleDeleteHorario(e) { 
    if (!e.target.classList.contains('btn-delete-horario')) {
        return;
    }

    const horarioId = e.target.dataset.id;
    if (confirm(`Tem certeza que deseja deletar o horário ID ${horarioId}?`)) {
        try {
            const data = await api.deleteHorario(horarioId);
            showMessage(data.message, 'success');
            loadHorarios(); // Atualiza a grade de horários na tela
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }
 }

// --- Kata Handlers ---
async function loadKatas() {
    try {
        const biblioteca = await api.fetchBiblioteca();
        // Agora chamamos nossa nova função para desenhar a lista na tela
        renderizarListaKatasAdmin(elements.kataListContainer, biblioteca);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}
// ... (lógica para criar e deletar posições de katas) ...
async function handleCreateKataPosicao(e) { 
e.preventDefault(); // Impede que o formulário recarregue a página

    const form = e.target;
    // Coleta todos os dados do formulário de criação de posição
    const dadosPosicao = {
        faixa_id: form.kataFaixa.value,
        grau: form.kataGrau.value,
        grupo_id: form.kataGrupo.value,
        titulo_grau: form.kataTituloGrau.value,
        nome_posicao: form.kataNomePosicao.value,
        video_url: form.kataVideoUrl.value,
    };

    // Validação simples
    if (!dadosPosicao.faixa_id || !dadosPosicao.grupo_id || !dadosPosicao.nome_posicao) {
        showMessage('Faixa, Grupo e Nome da Posição são obrigatórios.', 'error');
        return;
    }

    try {
        const data = await api.createKataPosicao(dadosPosicao);
        showMessage(data.message, 'success');
        form.reset(); // Limpa os campos do formulário
        loadKatas(); // Atualiza a lista de posições na tela
    } catch (error) {
        showMessage(error.message, 'error');
    }
 }
async function handleDeleteKataPosicao(e) { 
if (!e.target.classList.contains('btn-delete-kata')) {
        return;
    }

    const posicaoId = e.target.dataset.id;
    
    // 2. Pede confirmação antes de deletar
    if (confirm(`Tem certeza que deseja deletar a posição ID ${posicaoId}?`)) {
        try {
            const data = await api.deleteKataPosicao(posicaoId);
            showMessage(data.message, 'success');
            loadKatas(); // Atualiza a lista de posições na tela
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }
 }
