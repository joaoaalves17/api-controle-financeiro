# API de Controle Financeiro

API REST desenvolvida com Node.js e Express para gerenciamento de finanças pessoais, permitindo controlar receitas, despesas e categorias.

O projeto utiliza PostgreSQL para armazenamento dos dados e JWT para autenticação e proteção das rotas.

## Tecnologias utilizadas

- Node.js
- Express
- JavaScript
- PostgreSQL
- pg
- bcrypt
- JSON Web Token (JWT)
- dotenv
- Supertest
- Node.js Test Runner

## Funcionalidades

- Cadastro de usuários.
- Login com autenticação JWT.
- Criptografia de senhas com bcrypt.
- Cadastro e listagem de categorias.
- Cadastro, consulta, atualização e exclusão de movimentações.
- Filtros de movimentações por período e tipo.
- Resumo financeiro com receitas, despesas e saldo.
- Validação de dados.
- Isolamento dos dados por usuário autenticado.
- Testes automatizados.

## Estrutura do projeto

```text
src/
├── config/
│   └── database.js
├── controllers/
├── middlewares/
├── routes/
└── server.js

tests/
└── usuarios.test.js

.env.example
database.sql
package.json
```

## Como executar o projeto

### 1. Pré-requisitos

- Node.js instalado.
- PostgreSQL instalado.
- npm.

### 2. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
cd api-controle-financeiro
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto, utilizando o `.env.example` como referência.

Configure os dados de conexão com PostgreSQL e uma chave secreta para JWT.

### 5. Criar o banco de dados

Crie um banco chamado `controle_financeiro` no PostgreSQL.

Execute o conteúdo do arquivo `database.sql` nesse banco para criar as tabelas.

### 6. Iniciar a API

Modo desenvolvimento:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

A API será iniciada na porta configurada no arquivo `.env`.

## Testes automatizados

Para executar os testes:

```bash
npm test
```

O projeto possui **39 testes automatizados aprovados**, cobrindo autenticação, usuários, categorias, movimentações, validações e segurança.

## Objetivo do projeto

Projeto desenvolvido para praticar e aprimorar conhecimentos em desenvolvimento Backend com Node.js, construção de APIs REST, integração com banco de dados relacional, autenticação, segurança e testes automatizados.