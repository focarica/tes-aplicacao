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
  app/             Views, layouts e futuras entradas HTTP/Server Actions
  models/          Entidades e contratos de entrada/saída
  controllers/     Validação e coordenação das requisições (reservado)
  services/        Contratos de casos de uso e autenticação
  repositories/    Contrato de persistência do perfil
  lib/auth/        Adaptadores Cognito, sessão e autorização
infra/             Planejamento da rede e hospedagem AWS
```

O fluxo de autenticação usa views, Server Actions com validação e adaptadores
Cognito. Os contratos de perfil permanecem reservados para a persistência futura.

## Implementado

- Cadastro com nome completo, username, email e senha; confirmação nativa por código.
- Login com email e senha, logout e página protegida de dashboard.
- Cookie HttpOnly, Secure em produção e SameSite=Lax, com duração do access token.
- JWT verificado no servidor e identidade baseada no `sub` do Cognito.
- Testes automatizados sem chamadas reais à AWS.

Não há renovação automática de sessão; após expirar, é necessário entrar de novo.
MFA e outros desafios bloqueiam o login nesta versão. Logout tenta encerrar a
sessão no Cognito e sempre remove o cookie local; JWTs já emitidos podem continuar
válidos até expirar para verificadores offline.

Persistência e edição de perfil, imagem, descrição, recuperação/alteração de
senha e provisionamento AWS permanecem fora desta entrega. A validação com
User Pool real depende das variáveis de ambiente e da configuração AWS.
