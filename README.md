# Controle de Distratos

Sistema interno para gestão e controle de solicitações de distratos.

## Tecnologias Utilizadas

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend/Auth:** Supabase (PostgreSQL, Auth, RLS)
- **Gráficos:** Recharts
- **Exportação:** xlsx
- **Formulários:** React Hook Form + Zod

## Pré-requisitos

- Node.js v18+
- Projeto no [Supabase](https://supabase.com/)

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Acesse o **SQL Editor** no painel do Supabase.
3. Copie o conteúdo do arquivo `schema.sql` (encontrado nos artefatos da conversa ou na pasta principal se movido) e execute no SQL Editor. Isso criará a tabela `solicitacoes` e configurará o Row Level Security (RLS) para que cada usuário veja apenas seus próprios dados.
4. Crie pelo menos um usuário no menu **Authentication** do Supabase para fazer o login no sistema.

## Configuração Local

1. Instale as dependências:
```bash
npm install
```

2. Crie um arquivo `.env.local` na raiz do projeto e adicione as chaves do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```
Use `.env.example` como modelo e nunca versione arquivos `.env*` com valores reais.

Antes de commitar, rode:
```bash
npm run security:check
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse `http://localhost:3000` no seu navegador. O sistema irá redirecioná-lo para a tela de login.

## Estrutura do Projeto

- `src/app`: Rotas da aplicação (login, dashboard, solicitações, etc).
- `src/components/forms`: Componentes de formulário reutilizáveis.
- `src/components/layout`: Sidebar e Header.
- `src/components/ui`: Componentes do shadcn/ui.
- `src/lib/utils`: Funções de negócio (agrupamento e normalização).
- `src/lib/export`: Lógica de exportação para Excel.
- `src/lib/supabase`: Configuração dos clientes do Supabase (Client e Server) e Middleware.
- `src/types`: Tipagens e schemas do Zod.
- `tests`: Testes automatizados da lógica de agrupamento e resumo.

## Testes

Os testes da lógica de negócio de agrupamento e geração de resumo estão configurados utilizando sintaxe Jest/Vitest. Para executá-los em um ambiente real, configure o Vitest e rode:

```bash
npm run test
```
