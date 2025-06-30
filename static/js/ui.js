// /static/js/ui.js

/**
 * Exibe uma mensagem de feedback flutuante para o usuário.
 * @param {string} text - O texto da mensagem.
 * @param {string} type - O tipo de mensagem ('success' ou 'error').
 */
export function showMessage(text, type = 'success') {
    // Remove qualquer mensagem existente para não empilhar
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    messageContainer.textContent = text;
    document.body.appendChild(messageContainer);

    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => document.body.removeChild(messageContainer), 500);
    }, 3000);
}

/**
 * Configura a lógica de navegação por abas para um contêiner.
 * Encontra os botões e conteúdos com base em classes padrão.
 */
export function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length === 0) return; // Não faz nada se não houver abas na página

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId)?.classList.add('active'); // O '?' evita erro se o ID não for encontrado
        });
    });
}

/**
 * Aplica a máscara de telefone (XX) XXXXX-XXXX em um campo de input.
 * Esta função foi feita para ser usada como um listener de evento 'input'.
 * @param {Event} e - O evento de input do campo.
 */
export function formatarTelefone(e) {
    const input = e.target;
    // 1. Remove tudo que não é dígito
    let value = input.value.replace(/\D/g, '');
    const length = value.length;

    // 2. Aplica a máscara progressivamente
    if (length > 11) {
        value = value.slice(0, 11); // Limita a 11 dígitos
    }

    if (length > 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
    } else if (length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (length > 0) {
        value = `(${value.slice(0, 2)}`;
    }

    // 3. Define o valor formatado de volta no campo
    input.value = value;
}