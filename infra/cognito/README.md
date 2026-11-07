# AWS Cognito

O login usa email e senha. O cadastro coleta nome completo, username, email e
senha. O username permanece como identificador próprio da conta; email é alias
de login verificado pelo Cognito.

## User Pool

- Identificadores de login: Username e Email (email como alias).
- Cadastro self-service habilitado.
- Atributos obrigatórios: `name` e `email`, sem `nickname` obrigatório.
- Verificação automática de email habilitada, com código de confirmação.
- MFA desativado para o fluxo atual.
- Nenhum trigger de auto-confirmação.

As opções de identificador e atributos obrigatórios são definidas na criação
do pool. Um pool criado somente com username precisa ser substituído para
adotar email como alias.

## App Client

- Fluxo `ALLOW_USER_PASSWORD_AUTH` habilitado.
- Prevenção de erros de existência de usuário habilitada.
- `COGNITO_CLIENT_SECRET` configurado no servidor se o cliente tiver segredo.
- Sem necessidade de Hosted UI, domínio ou callback neste fluxo via SDK.

## Aplicação

As variáveis estão em `.env.example`; os valores locais ficam em `.env.local`.
Cadastro, confirmação, login e logout não exigem chaves IAM na aplicação.

O código de email é confirmado em `/confirm-signup` com o username cadastrado.
Após a confirmação, o login em `/login` usa email e senha. A entrega real dos
emails depende da configuração e dos limites de envio do Cognito/SES.
