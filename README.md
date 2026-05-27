<div align="center">

# ✨ Lúmen

**Organização pessoal com leveza, foco e clareza.**

*Um sistema web completo para gerenciamento de metas, finanças, memórias e diário pessoal.*

---

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

</div>

---

## 📖 Sobre o Projeto

O **Lúmen** é uma aplicação web de organização pessoal que reúne em um único lugar tudo o que você precisa para acompanhar seu desenvolvimento. Com uma interface moderna e intuitiva, o sistema permite criar metas, controlar finanças, guardar memórias especiais e manter um diário pessoal — tudo protegido por autenticação individual por usuário.

---

## 🚀 Funcionalidades

### 👤 Autenticação
- Cadastro de novo usuário com validação de dados
- Login seguro com controle de sessão via PHP
- Edição de perfil (nome, e-mail, telefone e senha)
- Logoff e proteção de rotas por sessão

### 🎯 Metas
- Criação de metas com título, descrição e data
- Definição de **prioridade** (baixa, média, alta) e **categoria**
- Controle de **progresso** (0–100%)
- Status: `a fazer`, `em andamento`, `concluída`
- Edição e exclusão de metas

### 💰 Financeiro
- Registro de **entradas** e **saídas**
- Classificação por **categoria** e **data**
- Visão consolidada do fluxo financeiro
- Edição e exclusão de registros

### 💜 Memórias
- Registro de momentos com título, descrição e data
- Upload de **imagem** associada à memória
- Classificação por **categoria** e **humor**
- Galeria visual de memórias pessoais

### 📔 Diário
- Entradas diárias com texto livre
- Registro de **humor** por entrada (`Muito Bem`, `Bem`, `Neutro`, `Mal`, `Muito Mal`)
- Navegação por datas
- Edição e exclusão de entradas

### 🛡️ Painel Administrativo
- Acesso restrito via credenciais de administrador
- Listagem de todos os usuários cadastrados
- Edição e exclusão de contas de usuário
- Gerenciamento de administradores (criar e excluir)
- **Métricas** de uso por módulo (total de metas, registros financeiros, memórias e entradas de diário)
- Busca de usuários por nome ou e-mail
- Resumo de cadastros do dia e da semana

---

## 🗂️ Estrutura do Projeto

```
projeto/
│
├── index.html              # Landing page
├── index.css
│
├── login/
│   ├── login.html          # Tela de login
│   └── login.css
│
├── home/
│   ├── home.html           # Dashboard do usuário
│   ├── home.css
│   ├── cliente_novo.html   # Cadastro de usuário
│   ├── cliente_novo.css
│   ├── cliente_alterar.html# Edição de perfil
│   └── cliente_alterar.css
│
├── metas/
│   ├── metas-index.html
│   ├── metas.css
│   └── metas.js
│
├── financeiro/
│   ├── financeiro.html
│   ├── financeiro.css
│   └── financeiro.js
│
├── memorias/
│   ├── memorias.html
│   ├── memorias.css
│   └── memorias.js
│
├── diario/
│   ├── diario.html
│   ├── diario.css
│   └── diario.js
│
├── admin/
│   ├── adm-index.html      # Painel administrativo
│   ├── adm-index.css
│   ├── adm-index.js
│   ├── adm_get_usuarios.php
│   ├── adm_alterar_usuario.php
│   ├── adm_excluir_usuario.php
│   ├── adm_get_admins.php
│   ├── adm_novo_admin.php
│   ├── adm_excluir_admin.php
│   └── adm_metricas.php
│
├── php/                    # Backend compartilhado
│   ├── conexao.php         # Conexão com o banco de dados
│   ├── cliente_login.php
│   ├── cliente_novo.php
│   ├── cliente_alterar.php
│   ├── cliente_get.php
│   ├── cliente_excluir.php
│   ├── cliente_logoff.php
│   ├── valida_sessao.php
│   └── recuperar_senha.php
│
├── js/                     # Scripts compartilhados
│   ├── cliente_login.js
│   ├── cliente_novo.js
│   ├── cliente_alterar.js
│   ├── valida_sessao.js
│   └── modal-excluir.js
│
├── css/                    # Estilos compartilhados
│   ├── modal-excluir.css
│   └── perfil.css
│
├── img/                    # Imagens e ícones
│
└── projeto.sql             # Script de criação do banco de dados
```

---

## 🗃️ Banco de Dados

O banco de dados `projeto` é composto pelas seguintes tabelas:

| Tabela          | Descrição                                         |
|-----------------|--------------------------------------------------|
| `cliente`       | Usuários cadastrados (nome, e-mail, telefone, senha) |
| `metas`         | Metas do usuário com prioridade, progresso e status |
| `financeiro`    | Registros de entrada e saída financeira          |
| `memorias`      | Memórias com imagem, humor e categoria           |
| `diario`        | Entradas de diário com humor por data            |
| `administrador` | Contas com acesso ao painel administrativo       |

Todas as tabelas (exceto `cliente` e `administrador`) possuem **chave estrangeira** referenciando `cliente(id)` com `ON DELETE CASCADE`.

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos

- [XAMPP](https://www.apachefriends.org/) (ou equivalente com Apache + PHP + MySQL)
- Navegador moderno

### Passo a passo

**1. Clone ou copie o projeto**

```bash
git clone https://github.com/seu-usuario/projeto.git
```

Ou baixe e extraia o ZIP na pasta `htdocs` do XAMPP.

**2. Coloque o projeto em `htdocs`**

```
C:\xampp\htdocs\Dev\projeto\
```

**3. Inicie o XAMPP**

Ative os módulos **Apache** e **MySQL** no painel do XAMPP.

**4. Importe o banco de dados**

Acesse o [phpMyAdmin](http://localhost/phpmyadmin) e importe o arquivo `projeto.sql`.  
Isso criará o banco `projeto` com todas as tabelas e o administrador padrão.

**5. Acesse no navegador**

```
http://localhost/Dev/projeto/index.html
```

---

## 🔐 Acesso Padrão

### Administrador

| Campo | Valor       |
|-------|-------------|
| E-mail | `adm@adm` |
| Senha  | `123`     |

> ⚠️ **Altere a senha padrão após o primeiro acesso.**

Painel administrativo: `http://localhost/Dev/projeto/admin/adm-index.html`

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia      | Finalidade                                     |
|-----------------|------------------------------------------------|
| HTML5 + CSS3    | Estrutura e estilização das páginas            |
| JavaScript (ES6+)| Interatividade, validações e chamadas à API   |
| PHP 8+          | Backend, sessões e integração com banco        |
| MySQL           | Persistência de dados                          |
| Bootstrap 5     | Grid responsivo e componentes de UI            |
| Font Awesome 6  | Ícones                                         |
| Google Fonts (Inter) | Tipografia                               |

---

## 📸 Páginas do Sistema

| Página              | URL                                         |
|---------------------|---------------------------------------------|
| Landing Page        | `/index.html`                               |
| Login               | `/login/login.html`                         |
| Cadastro            | `/home/cliente_novo.html`                   |
| Dashboard           | `/home/home.html`                           |
| Metas               | `/metas/metas-index.html`                   |
| Financeiro          | `/financeiro/financeiro.html`               |
| Memórias            | `/memorias/memorias.html`                   |
| Diário              | `/diario/diario.html`                       |
| Painel Admin        | `/admin/adm-index.html`                     |

---

## 📝 Licença

Este projeto foi desenvolvido para fins acadêmicos e de aprendizado.

---

<div align="center">

**LÚMEN © 2026** — Organização pessoal com propósito.

</div>
