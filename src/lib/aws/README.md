# Adaptadores AWS

Integração com Cognito em `src/lib/auth`, exclusivamente no servidor.

Dependências instaladas:

- `@aws-sdk/client-cognito-identity-provider`: cadastro, confirmação, login,
  logout e alteração de senha.
- `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`: upload direto,
  listagem e exclusão da galeria.
- `aws-jwt-verify`: validação criptográfica de JWTs, incluindo emissor, expiração,
  User Pool, App Client e finalidade do token.
- `server-only`: impede importação acidental de módulos sensíveis pelo cliente.

## Galeria (S3)

`src/lib/aws/s3.ts` usa um bucket privado, sem banco de metadados. Cada arquivo
fica em `uploads/{userId}/{uuid}__{nome-sanitizado}`; a listagem lê o prefixo do
usuário autenticado e assina uma URL de visualização por 1 hora. O upload usa
URL pré-assinada de `PUT` (5 minutos) e o navegador envia direto ao S3. A
exclusão valida o prefixo do usuário antes de apagar.

Variáveis: `AWS_REGION` e `S3_BUCKET` (ver `.env.example`). O bucket precisa de
CORS para `http://localhost:3000` (`PUT`, `GET`, `HEAD`) e a identidade AWS do
servidor precisa de `s3:ListBucket` no bucket e `s3:PutObject`, `s3:GetObject`
e `s3:DeleteObject` em `uploads/*`. Detalhes em `infra/README.md`.

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
