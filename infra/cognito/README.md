# AWS Cognito

O login usa email e senha. O cadastro coleta nome completo, username, email e
senha. O username permanece como identificador próprio da conta; email é alias
de login verificado pelo Cognito.

## User Pool

- Identificadores de login: Username e Email (email como alias).
- Cadastro self-service habilitado.
- Atributos obrigatórios: `name` e `email`, sem `nickname` obrigatório.
- Atributos customizados para o perfil: `custom:description` e
  `custom:avatar_key` (ambos string e mutáveis). Precisam ser criados antes de
  usar o cadastro com descrição e a edição de perfil; não podem ser removidos
  depois. O cadastro envia `custom:description` apenas quando o campo é
  preenchido.
- Verificação automática de email habilitada, com código de confirmação.
- MFA desativado para o fluxo atual.
- Nenhum trigger de auto-confirmação.
- Política de senha: mínimo de 8 caracteres, com pelo menos uma maiúscula,
  uma minúscula, um número e um símbolo. A aplicação replica esses requisitos
  no cadastro e na troca de senha para avisar antes do envio ao Cognito. Se a
  política do User Pool for alterada, atualize também
  `cognitoPasswordSchema` em `src/lib/auth/validation.ts`.

As opções de identificador e atributos obrigatórios são definidas na criação
do pool. Um pool criado somente com username precisa ser substituído para
adotar email como alias.

## App Client

- Fluxo `ALLOW_USER_PASSWORD_AUTH` habilitado.
- Prevenção de erros de existência de usuário habilitada.
- Permissões de leitura/escrita para `name`, `custom:description` e
  `custom:avatar_key` nas configurações de atributos do App Client.
- `COGNITO_CLIENT_SECRET` configurado no servidor se o cliente tiver segredo.
- Sem necessidade de Hosted UI, domínio ou callback neste fluxo via SDK.

## Aplicação

As variáveis estão em `.env.example`; os valores locais ficam em `.env.local`.
O cadastro consulta `ListUsers` antes de enviar `SignUp`, incluindo usuários
ainda não confirmados, e o perfil usa `AdminGetUser` para a data de criação.
Essas consultas exigem uma identidade IAM do servidor com as seguintes
permissões, substituindo região, conta e ID do pool:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["cognito-idp:ListUsers", "cognito-idp:AdminGetUser"],
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

A data de criação do perfil vem de `AdminGetUser`. Adicione `cognito-idp:AdminGetUser`
ao mesmo recurso do User Pool. Sem essa permissão, o restante do perfil continua
funcionando, mas a data aparece em branco. Leitura e edição dos próprios
atributos e a troca de senha usam o access token, sem IAM adicional.

Emails novos são normalizados para minúsculas. A busca por email no Cognito é
sensível a maiúsculas/minúsculas: contas anteriores com email em outro formato
precisam de normalização administrativa antes de depender dessa pré-validação.
A consulta tem consistência eventual e não é uma reserva atômica: cadastros
simultâneos ainda dependem da verificação de alias na confirmação. Não há
transferência forçada de alias entre contas.

O código de email é confirmado em `/confirm-signup` com o username cadastrado.
Após a confirmação, o login em `/login` usa email e senha. A entrega real dos
emails depende da configuração e dos limites de envio do Cognito/SES.
