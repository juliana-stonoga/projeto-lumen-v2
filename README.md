# Lúmen

Lúmen é uma aplicação web de organização pessoal desenvolvida em HTML, CSS, JavaScript e PHP, com banco de dados MySQL. O projeto reúne funcionalidades de diário, controle financeiro, gestão de metas e registro de memórias, tudo em uma interface leve e moderna.

## Funcionalidades principais

- Login de cliente e validação de sessão
- Cadastro de clientes
- Diário com entradas por data, humor e texto
- Financeiro para registrar entradas e saídas com categoria e data
- Gestão de metas com prioridade, categoria, progresso e status
- Memórias com título, descrição, data, categoria, humor e imagem
- Sistema de CRUD completo para cada módulo
- Navegação por sidebar entre os módulos
- Interface responsiva e botões com ícones consistentes

## Estrutura do projeto

- `index.html` - página inicial / mini home
- `home/` - área principal do cliente e páginas de cadastro/alteração
- `diario/` - módulo de diário com HTML, CSS, JS e backend PHP
- `financeiro/` - módulo financeiro com interface e scripts
- `metas/` - módulo de metas com controle de progresso
- `memorias/` - módulo de memórias pessoais
- `php/` - APIs e lógica de backend para cliente e validação de sessão
- `projeto.sql` - script de criação do banco de dados e tabelas

## Banco de dados

O banco de dados `projeto` contém as seguintes tabelas:

- `cliente`
- `metas`
- `financeiro`
- `memorias`
- `diario`

O arquivo `projeto.sql` define a estrutura completa das tabelas e as relações de chave estrangeira entre `cliente` e os demais módulos.

## Como usar

1. Configure o XAMPP ou outro servidor local compatível com PHP e MySQL.
2. Coloque o diretório do projeto em `htdocs`.
3. Importe `projeto.sql` no MySQL para criar o banco de dados e as tabelas.
4. Acesse o projeto via navegador no endereço local, por exemplo: `http://localhost/Dev/projeto/index.html`.
5. Use as páginas do menu para navegar entre `Metas`, `Financeiro`, `Memórias` e `Diário`.

## Observações

- O projeto usa Font Awesome para ícones.
- O frontend está estruturado em páginas estáticas interagindo com arquivos PHP para persistência.
- O layout segue uma identidade visual suave, com gradientes e efeitos translúcidos.

## Contato

Este README foi gerado para ajudar a entender a estrutura e o funcionamento básico do projeto.
