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
- Política de senha: mínimo de 8 caracteres, maiúsculas, minúsculas, números e
  símbolos. A aplicação também limita a 256 caracteres e não aceita espaços.

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
O cadastro consulta `ListUsers` antes de enviar `SignUp`, incluindo usuários
ainda não confirmados. Essa consulta exige uma identidade IAM do servidor com
a seguinte permissão, substituindo região, conta e ID do pool:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "cognito-idp:ListUsers",
      "Resource": "arn:aws:cognito-idp:REGIAO:CONTA:userpool/ID_DO_POOL"
    }
  ]
}
```

Localmente, pode ser usado um perfil AWS autenticado (por exemplo, via IAM
Identity Center e `AWS_PROFILE`). Na EC2, use a IAM Role da instância. O SDK
usa a cadeia padrão de credenciais; nenhum segredo é enviado ao navegador.
Sem credenciais ou permissão, o cadastro é bloqueado com uma mensagem específica.
Confirmação, login e logout continuam usando as APIs públicas do Cognito.

Emails novos são normalizados para minúsculas. A busca por email no Cognito é
sensível a maiúsculas/minúsculas: contas anteriores com email em outro formato
precisam de normalização administrativa antes de depender dessa pré-validação.
A consulta tem consistência eventual e não é uma reserva atômica: cadastros
simultâneos ainda dependem da verificação de alias na confirmação. Não há
transferência forçada de alias entre contas.

O código de email é confirmado em `/confirm-signup` com o username cadastrado.
Após a confirmação, o login em `/login` usa email e senha. A entrega real dos
emails depende da configuração e dos limites de envio do Cognito/SES.
