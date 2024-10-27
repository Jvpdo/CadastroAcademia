-- Renomeia a tabela original
ALTER TABLE alunos RENAME TO alunos_old;

-- Cria a nova tabela sem a restrição UNIQUE no campo 'email'
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

-- Copia os dados da tabela antiga para a nova tabela
INSERT INTO alunos (id, nome, email, telefone, sexo, dataNascimento, faixa, grau, plano)
SELECT id, nome, email, telefone, sexo, dataNascimento, faixa, grau, plano FROM alunos_old;

-- Remove a tabela antiga
DROP TABLE alunos_old;
