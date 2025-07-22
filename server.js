const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000; // Adapta para ambientes em nuvem
require('dotenv').config();

// Configura conexão com MariaDB
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 5
});

// --- Configuração do Multer para Upload de Arquivos ---

// Define onde os arquivos serão salvos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static/uploads/fotos_alunos/');
    },
    filename: function (req, file, cb) {
        // CORREÇÃO: Garanta que esta linha use crases (`)
        const nomeUnico = `foto-${Date.now()}-${file.originalname}`;
        cb(null, nomeUnico);
    }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
};

// Cria a instância do multer com a configuração de armazenamento e filtro
const upload = multer({ storage: storage, fileFilter: fileFilter });

// --- Fim da Configuração do Multer ---

// Middleware para proteger rotas e verificar permissão
const protegerRota = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (token == null) {
        // 401 Unauthorized - Não enviou o token
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) {
            // 403 Forbidden - Token inválido ou expirado
            return res.status(403).json({ error: 'Token inválido.' });
        }
        
        // Anexa os dados do usuário (payload do token) na requisição
        req.usuario = usuario; 
        
        // Passa para a próxima função (a rota em si)
        next(); 
    });
};

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Rota para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Criar novo aluno
// Usamos 'upload.single('foto')' para processar um único arquivo do campo com name="foto"
app.post('/alunos', protegerRota, upload.single('foto'), async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    // Os dados de texto vêm em req.body
    const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, senha } = req.body;
    // Os dados do arquivo vêm em req.file
    const fotoPath = req.file ? req.file.path : null; 

    let conn;
    try {
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        conn = await pool.getConnection();

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // A query de inserção agora inclui o caminho da foto
        const result = await conn.query(
            `INSERT INTO alunos (nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, senha, foto_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, senhaHash, fotoPath]
        );

        conn.release();
        res.status(201).json({ id: result.insertId, message: "Aluno criado com sucesso!" });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }
        console.error(err);
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Rota de Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    let conn;

    try {
        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({ error: 'Por favor, forneça email e senha.' });
        }

        conn = await pool.getConnection();
        
        // 1. Encontrar o usuário pelo email
        const [aluno] = await conn.query('SELECT * FROM alunos WHERE email = ?', [email]);
        if (!aluno) {
            // Usamos uma mensagem genérica por segurança
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 2. Comparar a senha enviada com a senha criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, aluno.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 3. Gerar o Token JWT
        const payload = {
            id: aluno.id,
            nome: aluno.nome,
            permissao: aluno.permissao
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '8h' // Token expira em 8 horas
        });
        
        // Login bem-sucedido!
        res.json({ 
            message: 'Login realizado com sucesso!',
            token: token, 
            permissao: aluno.permissao
        });

    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Buscar todos os alunos OU pesquisar por nome
app.get('/alunos', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    let conn;
    try {
        // Pega os parâmetros da URL: ?nome=joao&page=1&limit=10
        const { nome } = req.query;
        const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
        const limit = parseInt(req.query.limit) || 10; // 10 alunos por página, como você pediu
        const offset = (page - 1) * limit; // Calcula o deslocamento para a consulta SQL

        conn = await pool.getConnection();

        // Constrói a cláusula WHERE dinamicamente para a busca
        let whereClause = '';
        let params = [];
        if (nome && nome.trim() !== '') {
            whereClause = 'WHERE LOWER(nome) LIKE LOWER(?)';
            params.push(`%${nome}%`);
        }

        // 1. Query para contar o TOTAL de alunos que correspondem à busca
        const countQuery = `SELECT COUNT(*) as total FROM alunos ${whereClause}`;
        const [totalResult] = await conn.query(countQuery, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Query para buscar os alunos da PÁGINA ATUAL
        const dataQuery = `
            SELECT id, nome, email, telefone, plano 
            FROM alunos 
            ${whereClause} 
            ORDER BY nome ASC 
            LIMIT ? OFFSET ?
        `;
        // Adiciona os parâmetros de paginação
        params.push(limit, offset);

        const rows = await conn.query(dataQuery, params);
        conn.release();

        // Retorna tanto os dados quanto as informações de paginação
        res.json({
            alunos: rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
            }
        });

    } catch (err) {
        console.error("Erro ao buscar alunos com paginação:", err.message);
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Atualizar um aluno pelo ID
app.put('/alunos/:id', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    let conn;
    try {
        const alunoId = req.params.id;
        const { nome, email, telefone, sexo, dataNascimento, faixa, grau, plano } = req.body;
        
        // Validação simples para garantir que dados essenciais não são nulos
        if (!nome || !email) {
            return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
        }

        conn = await pool.getConnection();

        // ATENÇÃO: Verifique se os nomes das colunas (nome, email, etc.)
        // são os mesmos da sua tabela no banco de dados.
        const sql = `
            UPDATE alunos SET 
                nome = ?, 
                email = ?, 
                telefone = ?, 
                sexo = ?, 
                dataNascimento = ?, 
                faixa = ?, 
                grau = ?, 
                plano = ?
            WHERE id = ?`;
        
        const values = [nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, alunoId];
        
        const result = await conn.query(sql, values);
        
        conn.release();

        if (result.affectedRows > 0) {
            res.json({ message: "Aluno atualizado com sucesso!" });
        } else {
            res.status(404).json({ error: "Aluno não encontrado" });
        }
        
    } catch (err) {
        // --- CORREÇÃO ADICIONADA AQUI ---
        // Agora o erro será impresso no console do seu servidor!
        console.error("ERRO AO ATUALIZAR ALUNO:", err); 
        
        // Envia uma resposta genérica para o frontend
        res.status(500).json({ error: "Erro interno no servidor. Verifique o console para mais detalhes." });
    } finally {
        if (conn) conn.release();
    }
});

// Deletar um aluno pelo ID
app.delete('/alunos/:id', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
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

// Buscar um aluno pelo ID (ROTA NECESSÁRIA E PROTEGIDA)
app.get('/alunos/:id', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    let conn;
    try {
        // --- LINHA CORRIGIDA ---
        // A linha que faltava foi adicionada novamente.
        conn = await pool.getConnection(); 
        
        const [aluno] = await conn.query(`SELECT * FROM alunos WHERE id = ?`, [req.params.id]);
        conn.release();
        
        if (aluno) {
            // Agora retorna apenas os dados do aluno
            res.json({ data: aluno }); 
        } else {
            res.status(404).json({ error: "Aluno não encontrado" });
        }
    } catch (err) {
        console.error("Erro ao buscar detalhes do aluno:", err);
        res.status(500).json({ error: "Erro interno no servidor" });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o aluno logado buscar seus próprios dados
app.get('/api/meus-dados', protegerRota, async (req, res) => {
    // O middleware 'protegerRota' já validou o token e nos deu o 'req.usuario'
    const alunoId = req.usuario.id;
    let conn;

    try {
        conn = await pool.getConnection();
        // Usamos o ID que veio do token para buscar os dados com segurança
        const [aluno] = await conn.query('SELECT id, nome, email, telefone, sexo, dataNascimento, faixa, grau, plano, foto_path FROM alunos WHERE id = ?', [alunoId]);
        conn.release();

        if (aluno) {
            res.json(aluno);
        } else {
            res.status(404).json({ error: "Aluno não encontrado." });
        }

    } catch (err) {
        console.error("Erro ao buscar dados do aluno:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o aluno fazer check-in
app.post('/api/checkin', protegerRota, async (req, res) => {
    // O ID do aluno vem do token, garantindo que ninguém possa fazer check-in por outro.
    const alunoId = req.usuario.id;
    let conn;

    try {
        conn = await pool.getConnection();

        // 1. Verifica se o aluno já fez check-in no dia de hoje
        const hoje = new Date().toISOString().slice(0, 10); // Pega a data de hoje no formato YYYY-MM-DD
        const [checkinsAnteriores] = await conn.query(
            'SELECT * FROM checkins WHERE aluno_id = ? AND DATE(data_checkin) = ?',
            [alunoId, hoje]
        );

        if (checkinsAnteriores) {
            // Se encontrou um registro, retorna um erro de conflito (409)
            return res.status(409).json({ error: 'Você já fez o check-in hoje.' });
        }

        // 2. Se não houver check-in hoje, insere um novo registro
        await conn.query('INSERT INTO checkins (aluno_id) VALUES (?)', [alunoId]);

        conn.release();
        res.status(201).json({ message: 'Check-in realizado com sucesso!' });

    } catch (err) {
        console.error("Erro ao fazer check-in:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o aluno buscar seu histórico de check-ins
app.get('/api/me/checkins', protegerRota, async (req, res) => {
    // O ID do aluno vem do token de forma segura
    const alunoId = req.usuario.id;
    let conn;

    try {
        conn = await pool.getConnection();

        // Busca todos os check-ins do aluno, ordenados do mais recente para o mais antigo
        const checkins = await conn.query(
            'SELECT data_checkin FROM checkins WHERE aluno_id = ? ORDER BY data_checkin DESC',
            [alunoId]
        );

        conn.release();
        res.json(checkins); // Retorna a lista de check-ins

    } catch (err) {
        console.error("Erro ao buscar histórico de check-ins:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para buscar o histórico de check-ins de um aluno com paginação e filtro
app.get('/api/alunos/:id/checkins', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    const alunoId = req.params.id;
    // Pega os parâmetros da URL: ?page=1&date=2023-10-27
    const page = parseInt(req.query.page) || 1;
    const searchDate = req.query.date || '';
    const limit = 20; // 20 resultados por página
    const offset = (page - 1) * limit;

    let conn;
    try {
        conn = await pool.getConnection();

        // Constrói a cláusula WHERE dinamicamente para a busca por data
        let whereClause = 'WHERE aluno_id = ?';
        let params = [alunoId];
        
        if (searchDate) {
            whereClause += ' AND DATE(data_checkin) = ?';
            params.push(searchDate);
        }

        // Query para contar o número TOTAL de resultados (para calcular o total de páginas)
        const countQuery = `SELECT COUNT(*) as total FROM checkins ${whereClause}`;
        const [totalResult] = await conn.query(countQuery, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query principal com LIMIT e OFFSET para a paginação
        const dataQuery = `
            SELECT id, data_checkin 
            FROM checkins 
            ${whereClause} 
            ORDER BY data_checkin DESC 
            LIMIT ? OFFSET ?
        `;
        params.push(limit, offset);
        
        const checkins = await conn.query(dataQuery, params);
        
        conn.release();

        // Retorna os dados da página E as informações de paginação
        res.json({
            checkins: checkins,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems
            }
        });

    } catch (err) {
        console.error("Erro ao buscar histórico paginado:", err);
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para buscar a lista de presença do dia (Apenas Admin)
app.get('/api/presenca/hoje', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0'); // Meses são de 0-11
        const dia = String(agora.getDate()).padStart(2, '0');
        const hoje = `${ano}-${mes}-${dia}`;

        // Query com JOIN para pegar o nome e foto do aluno junto com o check-in
        const sql = `
            SELECT 
                a.id, 
                a.nome, 
                a.foto_path, 
                c.data_checkin
            FROM checkins c
            JOIN alunos a ON c.aluno_id = a.id
            WHERE DATE(c.data_checkin) = ?
            ORDER BY c.data_checkin DESC;
        `;
        
        const presencas = await conn.query(sql, [hoje]);
        conn.release();
        res.json(presencas);

    } catch (err) {
        console.error("Erro ao buscar lista de presença:", err);
        res.status(500).json({ error: 'Erro ao buscar a lista de presença.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o admin ADICIONAR um check-in manualmente
app.post('/api/checkins/manual', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { aluno_id, data_checkin } = req.body;

    if (!aluno_id || !data_checkin) {
        return res.status(400).json({ error: 'ID do aluno e data são obrigatórios.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            'INSERT INTO checkins (aluno_id, data_checkin) VALUES (?, ?)',
            [aluno_id, data_checkin]
        );
        conn.release();
        res.status(201).json({ id: result.insertId, message: 'Check-in adicionado com sucesso!' });
    } catch (err) {
        console.error("Erro ao adicionar check-in manual:", err);
        res.status(500).json({ error: 'Erro ao adicionar check-in.' });
    } finally {
        if (conn) conn.release();
    }
});


// Rota para o admin DELETAR um check-in específico pelo seu ID
app.delete('/api/checkins/:id', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params; // ID do check-in, não do aluno
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM checkins WHERE id = ?', [id]);
        
        conn.release();
        if (result.affectedRows > 0) {
            res.json({ message: 'Check-in deletado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Check-in não encontrado.' });
        }
    } catch (err) {
        console.error("Erro ao deletar check-in:", err);
        res.status(500).json({ error: 'Erro ao deletar o check-in.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o aluno logado alterar a própria senha
app.put('/api/me/alterar-senha', protegerRota, async (req, res) => {
    const { senhaAntiga, novaSenha } = req.body;
    const alunoId = req.usuario.id; // ID vem do token, é seguro.
    let conn;

    try {
        // Validação
        if (!senhaAntiga || !novaSenha) {
            return res.status(400).json({ error: 'Senha antiga e nova senha são obrigatórias.' });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
        }

        conn = await pool.getConnection();

        // 1. Busca o hash da senha atual do aluno no banco
        const [aluno] = await conn.query('SELECT senha FROM alunos WHERE id = ?', [alunoId]);
        if (!aluno) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // 2. Compara a senha antiga enviada com a que está no banco
        const senhaValida = await bcrypt.compare(senhaAntiga, aluno.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'A senha antiga está incorreta.' });
        }

        // 3. Criptografa a nova senha
        const salt = await bcrypt.genSalt(10);
        const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

        // 4. Atualiza a senha no banco de dados
        await conn.query('UPDATE alunos SET senha = ? WHERE id = ?', [novaSenhaHash, alunoId]);

        conn.release();
        res.json({ message: 'Senha alterada com sucesso!' });

    } catch (err) {
        console.error("Erro ao alterar senha:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o aluno atualizar seus dados (telefone, etc.)
app.put('/api/me/dados', protegerRota, async (req, res) => {
    const { telefone } = req.body; // Por enquanto, só o telefone
    const alunoId = req.usuario.id;

    if (!telefone) {
        return res.status(400).json({ error: 'O campo telefone é obrigatório.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(
            'UPDATE alunos SET telefone = ? WHERE id = ?',
            [telefone, alunoId]
        );
        conn.release();
        res.json({ message: 'Dados atualizados com sucesso!' });
    } catch (err) {
        console.error("Erro ao atualizar dados:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o aluno logado alterar a própria foto
app.put('/api/me/foto', protegerRota, upload.single('foto'), async (req, res) => {
    const alunoId = req.usuario.id;

    // Verifica se um arquivo foi realmente enviado
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo de foto foi enviado.' });
    }

    // Pega o caminho do novo arquivo salvo pelo multer
    const novaFotoPath = req.file.path;
    let conn;

    try {
        conn = await pool.getConnection();

        // 1. Antes de atualizar, busca o caminho da foto antiga para poder deletá-la
        const [aluno] = await conn.query('SELECT foto_path FROM alunos WHERE id = ?', [alunoId]);

        // 2. Atualiza o banco de dados com o caminho da nova foto
        await conn.query('UPDATE alunos SET foto_path = ? WHERE id = ?', [novaFotoPath, alunoId]);

        conn.release();

        // 3. Se existia uma foto antiga, deleta o arquivo do servidor
        if (aluno && aluno.foto_path) {
            // fs.unlink remove o arquivo. O try/catch interno evita que um erro aqui quebre a requisição.
            try {
                fs.unlinkSync(aluno.foto_path);
            } catch (unlinkErr) {
                console.error("Erro ao deletar a foto antiga:", unlinkErr);
            }
        }

        res.json({
            message: 'Foto atualizada com sucesso!',
            // Retorna o novo caminho para o frontend poder atualizar a imagem na tela
            foto_path: novaFotoPath 
        });

    } catch (err) {
        console.error("Erro ao atualizar a foto:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    } finally {
        if (conn) conn.release();
    }
});

// --- ROTAS PARA GERENCIAMENTO DE HORÁRIOS ---

// Rota para ADICIONAR um novo horário (Apenas Admin)
app.post('/api/horarios', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { dia_semana, horario_inicio, horario_fim, descricao, tipo_aula } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            'INSERT INTO horarios (dia_semana, horario_inicio, horario_fim, descricao, tipo_aula) VALUES (?, ?, ?, ?, ?)',
            [dia_semana, horario_inicio, horario_fim, descricao, tipo_aula || 'Com Kimono']
        );
        res.status(201).json({ id: result.insertId, message: 'Horário criado com sucesso!' });
    } catch (err) {
        console.error("Erro ao criar horário:", err);
        res.status(500).json({ error: 'Erro ao criar horário.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para LISTAR todos os horários (Pública ou para todos logados)
app.get('/api/horarios', protegerRota, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Ordena os horários para uma exibição lógica
        const horarios = await conn.query('SELECT * FROM horarios ORDER BY FIELD(dia_semana, "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"), horario_inicio');
        res.json(horarios);
    } catch (err) {
        console.error("Erro ao buscar horários:", err);
        res.status(500).json({ error: 'Erro ao buscar horários.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para DELETAR um horário (Apenas Admin)
app.delete('/api/horarios/:id', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM horarios WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            res.json({ message: 'Horário deletado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Horário não encontrado.' });
        }
    } catch (err) {
        console.error("Erro ao deletar horário:", err);
        res.status(500).json({ error: 'Erro ao deletar horário.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para ATUALIZAR um horário existente (Apenas Admin)
app.put('/api/horarios/:id', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { id } = req.params;
    // ===== CORREÇÃO AQUI: Agora aceitamos os novos campos =====
    const { descricao, horario_inicio, horario_fim, tipo_aula } = req.body; 

    if (!descricao || !horario_inicio || !horario_fim || !tipo_aula) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            // A query agora atualiza todos os campos
            'UPDATE horarios SET descricao = ?, horario_inicio = ?, horario_fim = ?, tipo_aula = ? WHERE id = ?',
            [descricao, horario_inicio, horario_fim, tipo_aula, id]
        );

        conn.release();

        if (result.affectedRows > 0) {
            res.json({ message: 'Horário atualizado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Horário não encontrado.' });
        }
    } catch (err) {
        console.error("Erro ao atualizar horário:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para BUSCAR todos os horários fixos da grade
app.get('/api/grade-horarios', protegerRota, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT horario FROM grade_horarios ORDER BY horario ASC');
        // Enviamos apenas um array de strings, ex: ["08:00", "09:00"]
        res.json(rows.map(r => r.horario));
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar horários da grade." });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para ADICIONAR um novo horário fixo
app.post('/api/grade-horarios', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { horario } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('INSERT INTO grade_horarios (horario) VALUES (?)', [horario]);
        res.status(201).json({ message: 'Horário adicionado à grade com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: "Erro ao adicionar horário à grade." });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para DELETAR um horário fixo
app.delete('/api/grade-horarios/:horario', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    // Usamos o próprio horário como um ID, já que ele é único
    const { horario } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM grade_horarios WHERE horario = ?', [horario]);
        if (result.affectedRows > 0) {
            res.json({ message: 'Horário removido da grade com sucesso!' });
        } else {
            res.status(404).json({ error: 'Horário não encontrado na grade.' });
        }
    } catch (err) {
        res.status(500).json({ error: "Erro ao remover horário da grade." });
    } finally {
        if (conn) conn.release();
    }
});

// --- ROTAS PARA A BIBLIOTECA DE KATAS ---

// Rota para o admin buscar dados de apoio para os formulários (lista de faixas e grupos)
app.get('/api/kata/admin-data', protegerRota, async (req, res) => {
    // Protegido para garantir que apenas admins acessem
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    let conn;
    try {
        conn = await pool.getConnection();
        // Busca todas as faixas e grupos disponíveis para preencher menus <select>
        const faixas = await conn.query('SELECT id, nome_faixa FROM kata_faixas ORDER BY ordem');
        const grupos = await conn.query('SELECT id, nome_grupo FROM kata_grupos ORDER BY id');
        res.json({ faixas, grupos });
    } catch (err) {
        console.error("Erro ao buscar dados de admin para katas:", err);
        res.status(500).json({ error: 'Erro ao buscar dados para o formulário.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o admin adicionar uma nova posição/técnica
app.post('/api/kata/posicoes', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    // Coleta todos os dados do formulário do admin
    const { faixa_id, grau, grupo_id, titulo_grau, nome_posicao, video_url } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            'INSERT INTO kata_posicoes (faixa_id, grau, grupo_id, titulo_grau, nome_posicao, video_url) VALUES (?, ?, ?, ?, ?, ?)',
            [faixa_id, grau, grupo_id, titulo_grau, nome_posicao, video_url]
        );
        res.status(201).json({ id: result.insertId, message: 'Posição adicionada com sucesso!' });
    } catch (err) {
        console.error("Erro ao adicionar posição:", err);
        res.status(500).json({ error: 'Erro ao adicionar posição.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para o admin deletar uma posição
app.delete('/api/kata/posicoes/:id', protegerRota, async (req, res) => {
    if (req.usuario.permissao !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('DELETE FROM kata_posicoes WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            res.json({ message: 'Posição deletada com sucesso!' });
        } else {
            res.status(404).json({ error: 'Posição não encontrada.' });
        }
    } catch (err) {
        console.error("Erro ao deletar posição:", err);
        res.status(500).json({ error: 'Erro ao deletar posição.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para buscar toda a estrutura da biblioteca (para o aluno e admin visualizarem)
app.get('/api/biblioteca', protegerRota, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // A query agora busca a coluna 'faixa_pai_id' também
        const query = `
            SELECT 
                c.id AS categoria_id, c.nome AS categoria_nome,
                f.id AS faixa_id, f.nome_faixa, f.faixa_pai_id,
                p.grau, p.titulo_grau,
                g.id AS grupo_id, g.nome_grupo,
                p.id AS posicao_id, p.nome_posicao, p.video_url
            FROM kata_categorias c
            JOIN kata_faixas f ON c.id = f.categoria_id
            LEFT JOIN kata_posicoes p ON f.id = p.faixa_id
            LEFT JOIN kata_grupos g ON p.grupo_id = g.id
            ORDER BY c.id, f.ordem, p.grau, g.id, p.nome_posicao;
        `;
        const rows = await conn.query(query);
        
        // --- NOVA LÓGICA DE PROCESSAMENTO PARA CRIAR A ÁRVORE ---
        const categorias = {};

        // 1. Primeira passagem: Monta um mapa de todas as faixas e suas posições
        rows.forEach(row => {
            if (!row.categoria_id) return;

            // Garante que a categoria exista no nosso objeto de trabalho
            if (!categorias[row.categoria_id]) {
                categorias[row.categoria_id] = { id: row.categoria_id, nome: row.categoria_nome, faixas: {} };
            }
            const catAtual = categorias[row.categoria_id];

            // Garante que a faixa exista
            if (!catAtual.faixas[row.faixa_id]) {
                catAtual.faixas[row.faixa_id] = { 
                    id: row.faixa_id, 
                    nome: row.nome_faixa, 
                    faixa_pai_id: row.faixa_pai_id,
                    graus: {},
                    sub_faixas: {} // Novo campo para aninhar as sub-faixas
                };
            }

            // Se a linha tem dados de uma posição, adiciona aos graus/grupos
            if (row.posicao_id) {
                const faixaAtual = catAtual.faixas[row.faixa_id];
                const grau = row.grau;

                if (!faixaAtual.graus[grau]) {
                    faixaAtual.graus[grau] = { grau: grau, titulo: row.titulo_grau || `Grau ${grau}`, grupos: {} };
                }

                if (row.grupo_id && !faixaAtual.graus[grau].grupos[row.grupo_id]) {
                    faixaAtual.graus[grau].grupos[row.grupo_id] = { id: row.grupo_id, nome: row.nome_grupo, posicoes: [] };
                }

                faixaAtual.graus[grau].grupos[row.grupo_id].posicoes.push({
                    id: row.posicao_id, nome: row.nome_posicao, video_url: row.video_url
                });
            }
        });
        
        // 2. Segunda passagem: Organiza a hierarquia, movendo sub-faixas para dentro de suas faixas-pai
        Object.values(categorias).forEach(cat => {
            const faixasPais = {};
            const faixasFilhas = [];

            // Separa as faixas entre pais e filhos
            Object.values(cat.faixas).forEach(faixa => {
                if (faixa.faixa_pai_id) {
                    faixasFilhas.push(faixa);
                } else {
                    faixasPais[faixa.id] = faixa;
                }
            });

            // Aninha os filhos nos pais
            faixasFilhas.forEach(filha => {
                if (faixasPais[filha.faixa_pai_id]) {
                    faixasPais[filha.faixa_pai_id].sub_faixas[filha.id] = filha;
                }
            });

            cat.faixas = Object.values(faixasPais);
        });
        
        // 3. Terceira passagem: Converte tudo para arrays para um JSON limpo e ordenado
        const resultadoFinal = Object.values(categorias).map(cat => ({
            ...cat,
            faixas: cat.faixas.map(f => ({
                ...f,
                graus: Object.values(f.graus).sort((a,b) => a.grau - b.grau).map(g => ({...g, grupos: Object.values(g.grupos)})),
                sub_faixas: Object.values(f.sub_faixas).map(sf => ({
                    ...sf,
                     graus: Object.values(sf.graus).sort((a,b) => a.grau - b.grau).map(g => ({...g, grupos: Object.values(g.grupos)}))
                }))
            }))
        }));

        res.json(resultadoFinal);

    } catch (err) {
        console.error("Erro ao buscar biblioteca:", err);
        res.status(500).json({ error: 'Erro ao buscar a biblioteca de katas.' });
    } finally {
        if (conn) conn.release();
    }
});



// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});