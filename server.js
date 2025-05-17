const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Adapta para ambientes em nuvem

// Configura conexão com MariaDB
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'PI-DRP03',
    database: 'cadastro_alunos',
    connectionLimit: 5
});

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Rota para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Criar novo aluno
app.post('/alunos', async (req, res) => {
    try {
        const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano } = req.body;
        const conn = await pool.getConnection();
        const result = await conn.query(`
            INSERT INTO alunos (nome, email, telefone, sexo, dataNascimento, faixa, grau, plano)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano]
        );
        conn.release();
        res.status(201).json({ id: result.insertId, message: "Aluno criado com sucesso!" });
    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    }
});

// Buscar todos os alunos ou por nome
app.get('/alunos', async (req, res) => {
    try {
        const nome = req.query.nome;
        const conn = await pool.getConnection();
        const sql = nome && nome.trim() !== '' ? 
            `SELECT id, nome FROM alunos WHERE LOWER(nome) LIKE LOWER(?)` : 
            `SELECT id, nome FROM alunos`;
        const params = nome ? [`%${nome}%`] : [];
        const rows = await conn.query(sql, params);
        conn.release();
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    }
});

// Buscar um aluno pelo ID
app.get('/alunos/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const aluno = await conn.query(`SELECT * FROM alunos WHERE id = ?`, [req.params.id]);
        conn.release();
        if (aluno.length > 0) {
            res.json({ data: aluno[0] });
        } else {
            res.status(404).json({ error: "Aluno não encontrado" });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    }
});

// Atualizar um aluno pelo ID
app.put('/alunos/:id', async (req, res) => {
    try {
        const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano } = req.body;
        const conn = await pool.getConnection();
        const result = await conn.query(`
            UPDATE alunos SET nome = ?, email = ?, telefone = ?, sexo = ?, dataNascimento = ?, faixa = ?, grau = ?, plano = ?
            WHERE id = ?`,
            [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, req.params.id]
        );
        conn.release();
        if (result.affectedRows > 0) {
            res.json({ message: "Aluno atualizado com sucesso!" });
        } else {
            res.status(404).json({ error: "Aluno não encontrado" });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    }
});

// Deletar um aluno pelo ID
app.delete('/alunos/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const result = await conn.query(`DELETE FROM alunos WHERE id = ?`, [req.params.id]);
        conn.release();
        if (result.affectedRows > 0) {
            res.json({ message: "Aluno deletado com sucesso!" });
        } else {
            res.status(404).json({ error: "Aluno não encontrado" });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});