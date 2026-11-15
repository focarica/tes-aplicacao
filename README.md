# TES — Esqueleto da aplicação

Base mínima em Next.js App Router, React e TypeScript.
A autenticação utiliza **AWS Cognito**.

## Executar localmente

Requisito: Node.js 22 e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Execute os comandos na raiz de `tes-aplicacao`.

Acesse http://localhost:3000. Para usar cadastro e login, preencha as variáveis
de Cognito em `.env.local` e habilite `USER_PASSWORD_AUTH` no App Client. O
formulário de login solicita somente email e senha. O User Pool usa username
e email como alias, com confirmação nativa por email. Consulte
`infra/cognito/README.md` para a configuração.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Organização (MVC adaptado ao Next.js)

```text
src/
  app/             Views, layouts e entradas HTTP/Server Actions
    dashboard/     Galeria protegida do usuário autenticado
  components/      Componentes de interface (auth e galeria)
  models/          Entidades e contratos de entrada/saída
  controllers/     Validação e coordenação das requisições (reservado)
  services/        Contratos de casos de uso e autenticação
  repositories/    Contrato de persistência do perfil
  lib/auth/        Adaptadores Cognito, sessão e autorização
  lib/aws/         Adaptador S3 (presign, listagem e exclusão)
  lib/media.ts     Classificação e validação de uploads
infra/             Planejamento da rede e hospedagem AWS
```

O fluxo de autenticação usa views, Server Actions com validação e adaptadores
Cognito. Os contratos de perfil permanecem reservados para a persistência futura.

## Frontend

O visual segue o projeto `gallery-TES`: Tailwind CSS v4, paleta em
`src/app/globals.css` (parchment, cream, sand, espresso e latte), cards
arredondados e layout responsivo. As telas de início, login, cadastro,
confirmação e dashboard usam o mesmo tema.

O dashboard exibe a galeria com abas por tipo, busca, estado vazio, upload e
exclusão. O envio usa URL pré-assinada e vai direto do navegador para o S3; a
listagem lê o prefixo do usuário autenticado e devolve URLs de visualização
assinadas. É preciso configurar o bucket e `S3_BUCKET` (ver `infra/README.md`).

## Implementado

- Cadastro com nome completo, username, email e senha; confirmação nativa por código.
- Consulta prévia de email no servidor via `ListUsers`, com permissão IAM restrita.
- Requisitos de senha exibidos em tempo real e validados também no servidor.
- Login com email e senha, logout e página protegida de dashboard.
- Cookie HttpOnly, Secure em produção e SameSite=Lax, com duração do access token.
- JWT verificado no servidor e identidade baseada no `sub` do Cognito.
- Galeria no S3: upload direto por URL pré-assinada, listagem por usuário e
  exclusão restrita ao dono.
- Testes automatizados sem chamadas reais à AWS.

Não há renovação automática de sessão; após expirar, é necessário entrar de novo.
MFA e outros desafios bloqueiam o login nesta versão. Logout tenta encerrar a
sessão no Cognito e sempre remove o cookie local; JWTs já emitidos podem continuar
válidos até expirar para verificadores offline.

Persistência e edição de perfil, imagem, descrição e recuperação/alteração de
senha permanecem fora desta entrega. A validação com User Pool e bucket S3
reais depende das variáveis de ambiente e da configuração AWS.
