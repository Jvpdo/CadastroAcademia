const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const path = require('path');


// Configura o Express para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Adicione esta rota para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Adicione middleware para analisar o corpo das requisições em formato JSON
app.use(bodyParser.json());

// Configurar pool de conexões com o MariaDB
const pool = mariadb.createPool({
     host: 'localhost', 
     user: 'root', 
     password: 'sua_senha',  // Substitua 'sua_senha' pela senha do usuário root
     database: 'cadastro_alunos',
     connectionLimit: 5
});

// Função auxiliar para executar consultas
async function query(sql, params) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(sql, params);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release(); // Libera a conexão de volta ao pool
    }
}

// Cria novo aluno
app.post('/alunos', async (req, res) => {
    const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano } = req.body;
    const sql = `INSERT INTO alunos (nome, email, telefone, sexo, dataNascimento, faixa, grau, plano) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano];
    
    try {
        const result = await query(sql, params);
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('Erro ao inserir aluno:', err);
        res.status(500).json({ error: err.message });
    }
});

// Lê todos os alunos ou filtra por nome
app.get('/alunos', async (req, res) => {
    const nome = req.query.nome;
    let sql = `SELECT id, nome FROM alunos`;
    let params = [];

    if (nome && nome.trim() !== '') {
        sql += ` WHERE nome LIKE ?`;
        params.push(`%${nome}%`);
    }

    try {
        const rows = await query(sql, params);
        res.json({ data: rows });
    } catch (err) {
        console.error('Erro ao buscar alunos:', err);
        res.status(500).json({ error: err.message });
    }
});

// Lê um aluno específico pelo ID
app.get('/alunos/:id', async (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM alunos WHERE id = ?`;
    const params = [id];

    try {
        const rows = await query(sql, params);
        res.json({ data: rows[0] });
    } catch (err) {
        console.error('Erro ao buscar aluno:', err);
        res.status(500).json({ error: err.message });
    }
});

// Atualiza um aluno pelo ID
app.put('/alunos/:id', async (req, res) => {
    const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano } = req.body;
    const id = req.params.id;
    const sql = `UPDATE alunos SET nome = ?, email = ?, telefone = ?, sexo = ?, dataNascimento = ?, faixa = ?, grau = ?, plano = ? WHERE id = ?`;
    const params = [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, id];

    try {
        await query(sql, params);
        res.json({ message: 'Aluno atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar aluno:', err);
        res.status(500).json({ error: err.message });
    }
});

// Deleta um aluno pelo ID
app.delete('/alunos/:id', async (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM alunos WHERE id = ?`;
    const params = [id];

    try {
        await query(sql, params);
        res.json({ message: 'Aluno deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar aluno:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
