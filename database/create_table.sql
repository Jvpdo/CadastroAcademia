CREATE TABLE alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    sexo TEXT NOT NULL,
    dataNascimento DATE,
    faixa TEXT NOT NULL,
    grau TEXT NOT NULL,
    plano TEXT NOT NULL
);
