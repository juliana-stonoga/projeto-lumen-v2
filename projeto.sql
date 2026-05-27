CREATE DATABASE projeto;

USE projeto;

CREATE TABLE cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    telefone VARCHAR(20) NOT NULL,

    senha VARCHAR(255) NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
    
);

create table if not exists metas (
    id int auto_increment primary key,
    cliente_id int not null,
    titulo varchar(200) not null,
    descricao text,
    data_meta date,
    prioridade varchar(20),
    categoria varchar(50),
    progresso int default 0,
    status_meta varchar(20) default 'a fazer',
    criado_em timestamp default current_timestamp,
    atualizado_em timestamp default current_timestamp on update current_timestamp,
    foreign key (cliente_id) references cliente(id) on delete cascade
);

CREATE TABLE if not exists financeiro (
    id int auto_increment primary key,
    cliente_id int not null,
    tipo enum('entrada', 'saida') not null,
    descricao varchar(255) not null,
    valor decimal(10,2) not null,
    categoria varchar(100),
    data_financeira date not null,
    criado_em timestamp default current_timestamp,
    atualizado_em timestamp default current_timestamp on update current_timestamp,
    foreign key (cliente_id) references cliente(id) on delete cascade	
);

CREATE TABLE IF NOT EXISTS memorias (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id   INT NOT NULL,
    titulo       VARCHAR(200) NOT NULL,
    descricao    TEXT,
    data_memoria DATE,
    categoria    VARCHAR(50),
    humor        VARCHAR(20),
    imagem_url   VARCHAR(500),
    criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diario (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id    INT         NOT NULL,
 
    -- Data a que a entrada se refere (pode diferir de criado_em)
    data_entrada  DATE        NOT NULL,
 
    -- Texto principal; TEXT suporta até 65 535 caracteres
    texto         TEXT        NOT NULL,
 
    -- Sentimento registrado junto com a entrada
    humor         ENUM('muito_bem','bem','neutro','mal','muito_mal') DEFAULT NULL,
 
    -- Controle de auditoria
    criado_em     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
    FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE,
 
    -- Índice para acelerar a busca por cliente + data (calendário)
    INDEX idx_diario_cliente_data (cliente_id, data_entrada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
CREATE TABLE administrador (
    id INT AUTO_INCREMENT PRIMARY KEY,

    email VARCHAR(150) NOT NULL UNIQUE,

    senha VARCHAR(255) NOT NULL
);

-- Credenciais padrão do administrador
-- Altere a senha após o primeiro acesso
INSERT INTO administrador (email, senha) VALUES ('adm@adm', '123');