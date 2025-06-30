// /static/js/apiService.js

function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Função genérica para fazer chamadas de API que enviam/recebem JSON.
 * @param {string} endpoint - A rota da API (ex: '/login').
 * @param {object} options - Opções adicionais para o fetch (method, body, etc.).
 * @returns {Promise<any>} - A resposta da API em formato JSON.
 */
async function fetchAPI(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, { ...options, headers });

    // Se a resposta não tiver corpo (ex: DELETE com status 204), retorna um objeto de sucesso
    if (response.status === 204) {
        return { success: true };
    }
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro na requisição.');
    }
    return data;
}

/**
 * Função específica para fazer upload de arquivos (usa FormData).
 * @param {string} endpoint - A rota da API.
 * @param {FormData} formData - O objeto FormData contendo o arquivo.
 * @returns {Promise<any>} - A resposta da API em formato JSON.
 */
async function fetchWithFile(endpoint, formData) {
    const headers = {};
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
        method: 'PUT', // ou POST, dependendo da rota
        headers,
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro no upload do arquivo.');
    }
    return data;
}

// --- Funções Exportadas ---

// Autenticação
export function loginUser(email, senha) {
    return fetchAPI('/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
    });
}

// Aluno Logado (Self-service)
export function fetchMeusDados() {
    return fetchAPI('/api/meus-dados');
}

export function updateMyData(data) {
    return fetchAPI('/api/me/dados', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function updateMyPassword(senhaAntiga, novaSenha) {
    return fetchAPI('/api/me/alterar-senha', {
        method: 'PUT',
        body: JSON.stringify({ senhaAntiga, novaSenha }),
    });
}

export function updateMyPhoto(formData) {
    return fetchWithFile('/api/me/foto', formData);
}

export function doCheckin() {
    return fetchAPI('/api/checkin', { method: 'POST' });
}

export function fetchMyCheckins() {
    return fetchAPI('/api/me/checkins');
}

// Admin - Gerenciamento de Alunos
export function fetchAlunos(nome = '') {
    return fetchAPI(`/alunos?nome=${encodeURIComponent(nome)}`);
}

export function fetchAlunoById(id) {
    return fetchAPI(`/alunos/${id}`);
}
// Checkin dos alunos
export function fetchPresencaDoDia() {
    return fetchAPI('/api/presenca/hoje');
}

export function createAluno(formData) {
    // Requer uma função de upload de arquivo diferente, pois não envia JSON
    const headers = {};
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch('/alunos', { method: 'POST', headers, body: formData })
        .then(res => res.json())
        .then(data => {
            if (!data.error) return data;
            throw new Error(data.error);
        });
}

export function updateAluno(id, data) {
    return fetchAPI(`/alunos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteAluno(id) {
    return fetchAPI(`/alunos/${id}`, { method: 'DELETE' });
}

// Conteúdo Geral (Horários, Katas)
export function fetchHorarios() {
    return fetchAPI('/api/horarios');
}

export function createHorario(data) {
    return fetchAPI('/api/horarios', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteHorario(id) {
    return fetchAPI(`/api/horarios/${id}`, { method: 'DELETE' });
}

export function fetchBiblioteca() {
    return fetchAPI('/api/biblioteca');
}

// Admin - Gerenciamento de Katas
export function fetchKataAdminData() {
    return fetchAPI('/api/kata/admin-data');
}

export function createKataPosicao(data) {
    return fetchAPI('/api/kata/posicoes', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function deleteKataPosicao(id) {
    return fetchAPI(`/api/kata/posicoes/${id}`, { method: 'DELETE' });
}

export function createManualCheckin(aluno_id, data_checkin) {
    return fetchAPI('/api/checkins/manual', {
        method: 'POST',
        body: JSON.stringify({ aluno_id, data_checkin }),
    });
}

export function deleteCheckin(checkinId) {
    return fetchAPI(`/api/checkins/${checkinId}`, { method: 'DELETE' });
}

export function fetchCheckinHistory(alunoId, page = 1, date = '') {
    // Constrói a URL com os parâmetros de página e data
    const url = `/api/alunos/${alunoId}/checkins?page=${page}&date=${date}`;
    return fetchAPI(url);
}
