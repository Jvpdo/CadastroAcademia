// /static/js/auth.js

/**
 * Salva o token e a permissão do usuário no localStorage.
 * @param {string} token - O token JWT recebido da API.
 * @param {string} permissao - A permissão do usuário (ex: 'admin', 'aluno').
 */
export function saveAuthData(token, permissao) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userPermissao', permissao);
}

/**
 * Limpa todos os dados de autenticação do localStorage.
 */
export function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userPermissao');
}

/**
 * Retorna o token de autenticação salvo.
 * @returns {string|null} - O token ou null se não existir.
 */
export function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Retorna a permissão do usuário salva.
 * @returns {string|null} - A permissão ou null se não existir.
 */
export function getUserPermissao() {
    return localStorage.getItem('userPermissao');
}

/**
 * Verifica se o usuário está logado (possui um token).
 * @returns {boolean} - True se estiver logado, false caso contrário.
 */
export function isLoggedIn() {
    return !!getAuthToken(); // O '!!' transforma a string (ou null) em um booleano
}