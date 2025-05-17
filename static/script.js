document.addEventListener('DOMContentLoaded', function() {
    // Máscara do telefone
    document.getElementById('telefone').addEventListener('input', function (e) {
        let input = e.target;
        let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        const length = value.length;

        if (length > 0 && length <= 2) {
            value = `(${value}`;
        } else if (length > 2 && length <= 7) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (length > 7 && length <= 11) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (length > 11) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        }

        input.value = value;
    });

    // Função para manipular a submissão do formulário
    document.getElementById('studentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const form = e.target;

        if (!form.checkValidity()) {
            alert('Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

       const formData = {
    nome: document.getElementById("nome").value,
    email: document.getElementById("email").value,
    telefone: document.getElementById("telefone").value,
    sexo: document.getElementById("sexo").value,
    dataNascimento: document.getElementById("dataNascimento").value,
    faixa: document.getElementById("faixa").value,
    grau: document.getElementById("grau").value,
    plano: document.getElementById("plano").value
};

fetch('/alunos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
})
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                document.getElementById('successMessage').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('successMessage').style.display = 'none';
                }, 3000);
            }
        })
        .catch(error => {
            document.getElementById('errorMessage').style.display = 'block';
            setTimeout(() => {
                document.getElementById('errorMessage').style.display = 'none';
            }, 3000);
        });
    });

// Função para buscar alunos
window.procurar = function() {
    const nomeBuscado = document.getElementById('inputNome').value.toLowerCase();

    fetch('/alunos')
        .then(response => response.json())
        .then(data => {
            console.log("Dados recebidos do backend:", data); // Log dos dados recebidos
            const tabela = document.getElementById('tabelaEstudantes');
            if (tabela) {
                tabela.innerHTML = '';
                data.data.forEach(aluno => {
                    // Se o campo de entrada estiver vazio, ou se o nome do aluno corresponder ao nome buscado, exibir o aluno
                    if (nomeBuscado === '' || aluno.nome.toLowerCase().includes(nomeBuscado)) {
                        console.log("Aluno:", aluno);  // Log de cada aluno
                        const row = tabela.insertRow();
                        row.insertCell(0).innerText = aluno.id || 'Sem ID';
                        const nomeCell = row.insertCell(1);
                        nomeCell.innerText = aluno.nome;
                        nomeCell.style.cursor = 'pointer';
                        nomeCell.onclick = () => mostrarDetalhes(aluno.id);
                    }
                });
            } else {
                console.error('Tabela de estudantes não encontrada.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
};
    
// Função para alternar entre a visualização e edição da idade
window.toggleEditIdade = function() {
    const idadeField = document.getElementById('alunoIdade');
    const dateInput = document.getElementById('editDataNascimento');

    if (dateInput.style.display === 'none') {
        // Mostrar o campo de data para editar a data de nascimento
        dateInput.style.display = 'inline';
        idadeField.style.display = 'none';

        // Definir o valor atual da data de nascimento no input
        dateInput.value = document.getElementById('editDataNascimentoHidden').value;
    } else {
        // Ocultar o campo de data e mostrar a idade atualizada
        dateInput.style.display = 'none';
        idadeField.style.display = 'inline';

        // Atualizar a data de nascimento armazenada
        const novaDataNascimento = dateInput.value;
        document.getElementById('editDataNascimentoHidden').value = novaDataNascimento;

        // Recalcular e atualizar a idade exibida
        const novaIdade = calcularIdade(novaDataNascimento);
        idadeField.textContent = novaIdade;
    }
}


    // Função para alternar entre campo de visualização e campo de edição
    window.toggleEdit = function(field) {
        const viewField = document.getElementById(`aluno${field}`);
        const editField = document.getElementById(`edit${field}`);

        if (editField && viewField) {
            if (editField.style.display === 'none') {
                editField.style.display = 'inline';
                viewField.style.display = 'none';
            } else {
                editField.style.display = 'none';
                viewField.style.display = 'inline';
            }
        } else {
            console.error(`Campos aluno${field} ou edit${field} não encontrados.`);
        }
    };

    let alunoIdSelecionado; // Variável global para armazenar o ID do aluno selecionado

    // Função para mostrar detalhes em um modal
    window.mostrarDetalhes = function(id) {
        if (!id) {
            console.error('ID do aluno não definido.');
            return;
        }
        fetch(`/alunos/${id}`)
            .then(response => response.json())
            .then(data => {
                console.log("Detalhes do aluno:", data);  // Log dos detalhes do aluno
                const aluno = data.data;   
    
                
                alunoIdSelecionado = aluno.id;
                // Atualizar a foto do aluno
            const alunoFoto = document.getElementById('alunoFoto');
            if (aluno.foto) {
                alunoFoto.src = aluno.foto;
                alunoFoto.style.display = 'block';
            } else {
                alunoFoto.style.display = 'none';
            }
                // Garantir que os valores não são NaN antes de usá-los
                // Atualizar os outros campos
                document.getElementById('alunoId').textContent = aluno.id || 'N/A';
                document.getElementById('alunoNome').textContent = aluno.nome || 'N/A';
                document.getElementById('alunoEmail').textContent = aluno.email || 'N/A';
                document.getElementById('alunoTelefone').textContent = aluno.telefone || 'N/A';
                document.getElementById('alunoSexo').textContent = aluno.sexo || 'N/A';
                document.getElementById('alunoIdade').textContent = aluno.dataNascimento ? calcularIdade(aluno.dataNascimento) : 'N/A';
                document.getElementById('alunoFaixa').textContent = aluno.faixa || 'N/A';
                document.getElementById('alunoGrau').textContent = aluno.grau || 'N/A';
                document.getElementById('alunoPlano').textContent = aluno.plano || 'N/A';
    
                // Preencher campos de edição no modal
                document.getElementById('editNome').value = aluno.nome || '';
                document.getElementById('editEmail').value = aluno.email || '';
                document.getElementById('editTelefone').value = aluno.telefone || '';
                document.getElementById('editSexo').value = aluno.sexo || '';
                document.getElementById('editFaixa').value = aluno.faixa || '';
                document.getElementById('editGrau').value = aluno.grau || '';
                document.getElementById('editPlano').value = aluno.plano || '';
                // Armazenar a data de nascimento no campo oculto
                document.getElementById('editDataNascimentoHidden').value = aluno.dataNascimento || '';
    
                // Abrir o modal
                document.getElementById('myModal').style.display = 'block';
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };  
    
    
    // Função para fechar o modal
    window.closeModal = function() {
        document.getElementById('myModal').style.display = 'none';
    };

    // Função para calcular a idade a partir da data de nascimento
    window.calcularIdade = function(dataNascimento) {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    };

    // Função para atualizar um aluno pelo ID selecionado
    window.atualizar = function() {
const dataNascimentoInput = document.getElementById("editDataNascimentoHidden").value;
const dataFormatada = new Date(dataNascimentoInput).toISOString().split("T")[0]; // Converte para YYYY-MM-DD

const formData = {
    nome: document.getElementById("editNome").value,
    email: document.getElementById("editEmail").value,
    telefone: document.getElementById("editTelefone").value,
    sexo: document.getElementById("editSexo").value,
    dataNascimento: dataFormatada,  // Agora está no formato correto!
    faixa: document.getElementById("editFaixa").value,
    grau: document.getElementById("editGrau").value,
    plano: document.getElementById("editPlano").value,
};

fetch(`/alunos/${alunoIdSelecionado}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
})
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            closeModal(); // Fecha o modal após atualizar
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    // Função para deletar um aluno pelo ID selecionado
    window.deletar = function() {
        if (confirm("Tem certeza que deseja deletar este aluno?")) {
            fetch(`/alunos/${alunoIdSelecionado}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao deletar o aluno.');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                closeModal(); // Fecha o modal após deletar
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    };

    // Função para fechar o modal ao clicar fora dele
    window.onclick = function(event) {
        const modal = document.getElementById('myModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
