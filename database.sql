CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(10) NOT NULL
        CHECK (tipo IN ('receita', 'despesa')),

    CONSTRAINT fk_categoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT categoria_unica
        UNIQUE (usuario_id, nome, tipo),

    CONSTRAINT categorias_id_usuario_tipo_unique
        UNIQUE (id, usuario_id, tipo)
);

CREATE TABLE movimentacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL CHECK (valor > 0),
    tipo VARCHAR(10) NOT NULL
        CHECK (tipo IN ('receita', 'despesa')),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_movimentacao_categoria_usuario_tipo
        FOREIGN KEY (categoria_id, usuario_id, tipo)
        REFERENCES categorias (id, usuario_id, tipo)
);