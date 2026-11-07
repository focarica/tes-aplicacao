# Adaptadores AWS

Espaço reservado à integração com Cognito, exclusivamente no servidor.

Dependências instaladas:

- `@aws-sdk/client-cognito-identity-provider`: cadastro, confirmação, login,
  logout e alteração de senha.
- `aws-jwt-verify`: validação criptográfica de JWTs, incluindo emissor, expiração,
  User Pool, App Client e finalidade do token.
- `server-only`: impede importação acidental de módulos sensíveis pelo cliente.

O adaptador implementará `AuthService`. Criar sessão com cookies HttpOnly,
Secure em produção e SameSite apropriado, proteção CSRF e renovação/revogação.
Não armazenar senhas ou tokens em localStorage, logs ou no modelo `User`.

Variáveis previstas em `.env.example`. O SDK deve usar a cadeia padrão de
credenciais; na EC2, preferir IAM Role de privilégio mínimo, sem chaves estáticas.
App Clients com segredo exigem SECRET_HASH calculado no servidor. Os fluxos e
desafios habilitados no User Pool deverão ser tratados antes de liberar acesso.

Nenhum cliente AWS é instanciado ou chamado neste esqueleto.
