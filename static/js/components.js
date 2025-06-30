// /static/js/components.js (VERSÃO FINAL E CORRIGIDA)

/**
 * Renderiza a grelha de horários num contentor específico.
 */
export function renderizarGradeDeHorarios(container, horarios, isAdmin = false) {
    if (!container) return;
    container.innerHTML = '';

    const horariosPorDia = horarios.reduce((acc, horario) => {
        const dia = horario.dia_semana;
        if (!acc[dia]) acc[dia] = [];
        acc[dia].push(horario);
        return acc;
    }, {});
    
    const diasDaSemana = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];

    diasDaSemana.forEach(diaCompleto => {
        const column = document.createElement('div');
        column.className = 'day-column';
        let subtituloHtml = (diaCompleto === 'Terça-feira' || diaCompleto === 'Sexta-feira') ? '<span class="day-subtitle">No Gi</span>' : '';
        const diaAbreviado = diaCompleto.replace('-feira', '');
        column.innerHTML = `<div class="day-header"><span>${diaAbreviado}</span>${subtituloHtml}</div>`;
        const aulasDoDia = horariosPorDia[diaCompleto] || [];
        aulasDoDia.sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio));
        aulasDoDia.forEach(aula => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.innerHTML = `
                <div class="horario">${aula.horario_inicio.slice(0, 5)}</div>
                <div class="descricao">${aula.descricao}</div>
                ${isAdmin ? `<button class="btn-delete-horario" data-id="${aula.id}" title="Apagar">&times;</button>` : ''}
            `;
            column.appendChild(slot);
        });
        container.appendChild(column);
    });
}

/**
 * Renderiza a biblioteca de katas para o painel do aluno.
 */
export function renderizarBibliotecaKatas(container, biblioteca, onLeafNodeClick) {
    if (!container) return;
    container.innerHTML = '';

    if (!biblioteca || biblioteca.length === 0) {
        container.innerHTML = '<p>A biblioteca de técnicas ainda não foi preenchida.</p>';
        return;
    }

    function criarAcordeaoItem(item, nivel) {
        const accordionItem = document.createElement('div');
        accordionItem.className = `accordion-level-${nivel}`;
        const header = document.createElement('div');
        header.className = 'accordion-header';
        
        if (typeof item.grau !== 'undefined') {
            header.textContent = `Grau ${item.grau}`;
        } else {
            header.textContent = item.nome;
        }

        const hasSubFaixas = item.sub_faixas && item.sub_faixas.length > 0;
        const hasGraus = item.graus && item.graus.length > 0;
        const hasGrupos = item.grupos && item.grupos.length > 0;
        const isLeafNode = hasGrupos && !(hasSubFaixas || (hasGraus && item.graus.length > 1 && item.sub_faixas));

        if (isLeafNode) {
            header.classList.add('is-leaf');
            header.addEventListener('click', () => onLeafNodeClick(item));
        } else if (hasSubFaixas || hasGraus) {
            header.classList.add('has-children');
            const content = document.createElement('div');
            content.className = 'accordion-content';

            if (hasSubFaixas) {
                if(hasGraus) {
                    const todaFaixaGraus = item.graus.filter(g => g.grupos && g.grupos.length > 0);
                     if (todaFaixaGraus.length > 0) {
                        const todaFaixaItem = {
                            nome: `Toda ${item.nome}`,
                            graus: [], 
                            grupos: todaFaixaGraus.flatMap(g => g.grupos)
                        };
                        content.appendChild(criarAcordeaoItem(todaFaixaItem, nivel + 1));
                     }
                }
                item.sub_faixas.forEach(sub => content.appendChild(criarAcordeaoItem(sub, nivel + 1)));
            } else if (hasGraus) {
                item.graus.forEach(grau => content.appendChild(criarAcordeaoItem(grau, nivel + 1)));
            }
            
            accordionItem.appendChild(content);
            header.addEventListener('click', (e) => {
                if(e.target !== header) return;
                header.classList.toggle('active');
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
                setTimeout(() => {
                    let parent = content.parentElement.closest('.accordion-content');
                    while(parent) {
                        if (parent.style.maxHeight) {
                            parent.style.maxHeight = parent.scrollHeight + "px";
                        }
                        parent = parent.parentElement.closest('.accordion-content');
                    }
                }, 150);
            });
        } else {
            header.classList.add('no-children');
        }
        accordionItem.prepend(header);
        return accordionItem;
    }

    biblioteca.forEach(categoria => {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'kata-categoria-container';
        categoriaDiv.innerHTML = `<h2 class="kata-categoria-title">${categoria.nome}</h2>`;
        
        let faixasParaExibir = categoria.faixas;
        if (categoria.nome.toLowerCase().includes('infantil')) {
            const faixasInfantisDesejadas = ['cinza', 'amarela', 'laranja', 'verde'];
            faixasParaExibir = categoria.faixas.filter(f => faixasInfantisDesejadas.some(desejada => f.nome.toLowerCase() === desejada));
        }

        faixasParaExibir.forEach(faixa => {
            categoriaDiv.appendChild(criarAcordeaoItem(faixa, 1)); 
        });
        container.appendChild(categoriaDiv);
    });
}

/**
 * Renderiza a lista de posições de katas para o painel do admin com menu sanfonado.
 */
export function renderizarListaKatasAdmin(container, biblioteca) {
    if (!container) return;
    container.innerHTML = '';

    if (!biblioteca || biblioteca.length === 0) {
        container.innerHTML = '<p>Nenhuma posição cadastrada ainda.</p>';
        return;
    }

    function criarAcordeaoAdminItem(item, nivel) {
        const accordionItem = document.createElement('div');
        accordionItem.className = `accordion-level-${nivel}`;

        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.textContent = item.nome || `Grau ${item.grau}`;

        let temFilhos = (item.graus && item.graus.length > 0) || (item.grupos && item.grupos.length > 0);
        
        if (temFilhos) {
            header.classList.add('has-children');
            const content = document.createElement('div');
            content.className = 'accordion-content';

            if (item.graus && item.graus.length > 0) {
                item.graus.forEach(grau => content.appendChild(criarAcordeaoAdminItem(grau, nivel + 1)));
            }

            if (item.grupos && item.grupos.length > 0) {
                item.grupos.forEach(grupo => {
                    const grupoTitle = document.createElement('h5');
                    grupoTitle.className = 'kata-grupo-title';
                    grupoTitle.textContent = grupo.nome;
                    content.appendChild(grupoTitle);
                    
                    grupo.posicoes.forEach(posicao => {
                        const posItem = document.createElement('div');
                        posItem.className = 'kata-posicao-item';
                        posItem.innerHTML = `
                            <span>${posicao.nome}</span>
                            <button class="btn-delete-kata" data-id="${posicao.id}" title="Apagar Posição">&times;</button>
                        `;
                        content.appendChild(posItem);
                    });
                });
            }
            
            accordionItem.appendChild(content);

            header.addEventListener('click', (e) => {
                if(e.target !== header) return;
                header.classList.toggle('active');
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
                setTimeout(() => {
                    let parent = content.parentElement.closest('.accordion-content');
                    while(parent) {
                        if (parent.style.maxHeight) {
                            parent.style.maxHeight = parent.scrollHeight + "px";
                        }
                        parent = parent.parentElement.closest('.accordion-content');
                    }
                }, 150);
            });
        } else {
             header.classList.add('no-children');
        }

        accordionItem.prepend(header);
        return accordionItem;
    }

    biblioteca.forEach(categoria => {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'kata-categoria-container';
        categoriaDiv.innerHTML = `<h2 class="kata-categoria-title">${categoria.nome}</h2>`;
        
        categoria.faixas.forEach(faixa => {
            categoriaDiv.appendChild(criarAcordeaoAdminItem(faixa, 1)); 
        });
        container.appendChild(categoriaDiv);
    });
}
