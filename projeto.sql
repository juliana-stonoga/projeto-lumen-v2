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

SELECT * FROM cliente

use projeto;

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