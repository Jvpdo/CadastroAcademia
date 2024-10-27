const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database/database');
const app = express();
const port = 3000;
const path = require('path');


// Configura o Express para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Adicione esta rota para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Adicione middleware para analisar o corpo das requisições em formato JSON
app.use(bodyParser.json());

// Cria novo aluno
app.post('/alunos', (req, res) => {
    const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano } = req.body;
    db.run(`INSERT INTO alunos (nome, email, telefone, sexo, dataNascimento, faixa, grau, plano) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Lê todos os alunos ou filtra por nome, retornando apenas id e nome
app.get('/alunos', (req, res) => {
    const nome = req.query.nome;
    let sql = `SELECT id, nome FROM alunos`;
    let params = [];

    // Adiciona o filtro de nome caso ele exista e não seja uma string vazia
    if (nome && nome.trim() !== '') {
        sql += ` WHERE nome LIKE ?`;
        params.push(`%${nome}%`);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});


// Lê um aluno específico pelo ID
app.get('/alunos/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM alunos WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ data: row });
    });
});

// Atualiza um aluno pelo ID
app.put('/alunos/:id', (req, res) => {
    const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano } = req.body;
    const id = req.params.id;
    db.run(`UPDATE alunos SET nome = ?, email = ?, telefone = ?, sexo = ?, dataNascimento = ?, faixa = ?, grau = ?, plano = ? WHERE id = ?`,
        [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, id],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ message: 'Aluno atualizado com sucesso' });
        }
    );
});

// Deleta um aluno pelo ID
app.delete('/alunos/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM alunos WHERE id = ?`, [id], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Aluno deletado com sucesso' });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

