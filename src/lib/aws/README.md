# Adaptadores AWS

Integração com Cognito em `src/lib/auth`, exclusivamente no servidor.

Dependências instaladas:

- `@aws-sdk/client-cognito-identity-provider`: cadastro, confirmação, login,
  logout e alteração de senha.
- `aws-jwt-verify`: validação criptográfica de JWTs, incluindo emissor, expiração,
  User Pool, App Client e finalidade do token.
- `server-only`: impede importação acidental de módulos sensíveis pelo cliente.

Os adaptadores fornecem cadastro, confirmação, login e logout. A sessão usa
cookie HttpOnly, Secure em produção e SameSite=Lax; as mutações usam Server
Actions com a verificação de origem padrão do Next.js. Não há renovação automática.

Variáveis em `.env.example`. A consulta prévia de email usa `ListUsers` e exige
credenciais IAM do servidor, com permissão restrita ao User Pool conforme
`infra/cognito/README.md`. Os demais fluxos usam as APIs públicas. App Clients
com segredo usam SECRET_HASH calculado no servidor.
Desafios adicionais de autenticação não criam sessão nesta versão.

O fluxo de senha requer `USER_PASSWORD_AUTH` habilitado no App Client. O login
usa email e senha; o cadastro também coleta nome e username. A configuração de
confirmação nativa por email está descrita em `infra/cognito/README.md`.
Os identificadores do pool e cliente ficam em `.env.local` conforme `.env.example`.
