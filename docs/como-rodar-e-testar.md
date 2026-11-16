# Como rodar e testar

## 1. Pré-requisitos

| Item | Detalhe |
| --- | --- |
| Node.js 22 e npm | `nvm use` lê a versão do `.nvmrc` |
| User Pool do Cognito | Configurado conforme [infra/cognito/README.md](../infra/cognito/README.md) |
| Bucket S3 privado | Com CORS para `http://localhost:3000`, conforme [infra/README.md](../infra/README.md#s3-galeria) |
| Credenciais AWS locais | Perfil AWS ou credenciais temporárias no ambiente (a cadeia padrão do SDK) |

Os **testes automatizados não precisam de AWS**: eles simulam Cognito e S3. Só rodar a aplicação de verdade exige os itens acima.

## 2. Instalar e configurar

```bash
git clone https://github.com/focarica/tes-aplicacao.git
cd tes-aplicacao
npm ci
cp .env.example .env.local
```

Preencha `.env.local`:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `AWS_REGION` | Sim | Região do User Pool e do bucket (padrão `us-east-1`) |
| `COGNITO_USER_POOL_ID` | Sim | ID do User Pool |
| `COGNITO_CLIENT_ID` | Sim | ID do App Client |
| `COGNITO_CLIENT_SECRET` | Só se o App Client tiver secret | Nunca expor ao navegador |
| `S3_BUCKET` | Sim | Nome do bucket privado da galeria |

Requisitos no Cognito que costumam causar erro quando faltam: fluxo `USER_PASSWORD_AUTH` habilitado no App Client, atributos customizados `custom:description` e `custom:avatar_key`, e permissão IAM `cognito-idp:ListUsers` (cadastro) e `cognito-idp:AdminGetUser` (data de criação do perfil).

## 3. Executar

```bash
npm run dev      # desenvolvimento em http://localhost:3000
```

Roteiro de verificação manual:

1. Abra `/signup`, cadastre-se e confirme o código recebido por e-mail em `/confirm-signup`.
2. Entre em `/login` com e-mail e senha: você cai em `/dashboard`.
3. Envie uma imagem na galeria, abra a prévia e exclua.
4. Em `/dashboard/perfil`, edite nome e descrição, troque a foto e a senha.
5. Teste a API no console do navegador (já logado):

```js
await (await fetch("/api/profile")).json();
await (await fetch("/api/profile", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fullName: "Nome Teste", description: "Editado pela API" }),
})).json();
```

## 4. Testar

```bash
npm test             # Vitest (jsdom), roda uma vez
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint, falha com qualquer aviso
```

Para um arquivo ou teste específico:

```bash
npx vitest run tests/profile-controller.test.ts
npx vitest run -t "nome parcial do teste"
```

### Mapa dos testes (`tests/`)

| Arquivo | Cobre |
| --- | --- |
| `auth.test.ts`, `auth-errors.test.ts`, `auth-flow.test.tsx` | Validação de entrada, mensagens de erro e fluxo de autenticação |
| `signup-action.test.ts` | Server Action de cadastro e confirmação |
| `cognito.test.ts` | Adaptador Cognito |
| `profile.test.ts`, `profile-actions.test.ts` | Leitura e edição do perfil, Server Actions |
| `profile-controller.test.ts`, `user-service.test.ts`, `user-repository.test.ts` | Camadas controller, service e repository |
| `profile-api.test.ts` | Rotas `/api/profile` e `/api/profile/avatar` |
| `media.test.ts`, `images.test.ts`, `loaded-image.test.tsx` | Limites de upload, imagens e componente de imagem |

O alias `server-only` aponta para `tests/mocks/server-only.ts` em `vitest.config.mts`, o que permite testar módulos exclusivos do servidor.

### Resultado atual (16/11/2026, branch `dev`)

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Passa |
| `npm test` | 116 de 124 passam; **8 falham** (ver abaixo) |
| `npm run lint` | 0 erros, **5 avisos** (`<img>` em vez de `next/image`), e o script falha por `--max-warnings=0` |

Os 8 testes que falham, em `tests/auth.test.ts` e `tests/signup-action.test.ts`, usam a senha `"senha-simples"`, que não cumpre a política atual (`cognitoPasswordSchema` exige maiúscula, número e símbolo). A validação do cadastro rejeita o dado de teste, e não o contrário. A correção é atualizar a senha usada nos testes para uma que cumpra a política, por exemplo `"Senha-Forte1!"`. Veja [deploy-e-pendencias.md](deploy-e-pendencias.md#problemas-conhecidos).

### Testes da infraestrutura

```bash
cd infra/terraform
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
terraform test        # provedor simulado: sem credenciais, sem criar recursos
```

## 5. Build de produção

```bash
npm run build
npm start             # next start, para conferir o build localmente
```

O `next.config.ts` usa `output: "standalone"`. Para rodar o servidor gerado (como na EC2):

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

Em produção o cookie de sessão é `Secure`: sem HTTPS o navegador o descarta e o login não se mantém. Roteiro completo em [deploy-e-pendencias.md](deploy-e-pendencias.md).

## 6. Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| "variáveis de ambiente" no cadastro ou login | `.env.local` incompleto (`COGNITO_*`, `AWS_REGION`) |
| Cadastro bloqueado com mensagem de permissão | Credenciais AWS ausentes ou sem `cognito-idp:ListUsers` |
| Login falha com credenciais corretas | `USER_PASSWORD_AUTH` desabilitado no App Client, ou MFA ativo |
| "O armazenamento não está configurado." | `S3_BUCKET` ou `AWS_REGION` ausentes |
| Upload falha no navegador (erro de CORS) | Bucket sem CORS para a origem (`PUT`, `GET`, `HEAD`, `ETag` exposto) |
| Data de criação em branco no perfil | Falta `cognito-idp:AdminGetUser` |
| Sessão some em produção | Aplicação servida sem HTTPS |
