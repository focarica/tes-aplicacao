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
    dashboard/     Galeria e perfil do usuário autenticado
    api/profile/   API REST do perfil (consulta, edição e foto)
  components/      Componentes de interface (auth e galeria)
  models/          Entidades e contratos de entrada/saída
  controllers/     Sessão, validação e erros do perfil (actions e API)
  services/        Contrato de autenticação e serviço de perfil
  repositories/    Contrato e implementação Cognito do perfil
  lib/auth/        Adaptadores Cognito, sessão e autorização
  lib/aws/         Adaptador S3 (presign, listagem e exclusão)
  lib/media.ts     Classificação e validação de uploads
infra/             Terraform da rede AWS e configuração de Cognito/S3
```

O fluxo de autenticação usa views, Server Actions com validação e adaptadores
Cognito. O perfil usa os atributos do próprio User Pool e a foto fica no S3,
sem banco de dados adicional. As Server Actions e a API de perfil passam pelo
controller, pelo serviço e pelo repositório de perfil, que usam esses
adaptadores; trocar o armazenamento exige apenas outra implementação de
`UserRepository`.

## Frontend

O visual segue o projeto `gallery-TES`: Tailwind CSS v4, paleta em
`src/app/globals.css` (parchment, cream, sand, espresso e latte), cards
arredondados e layout responsivo. As telas de início, login, cadastro,
confirmação e dashboard usam o mesmo tema.

O dashboard exibe a galeria com abas por tipo, busca, estado vazio, upload e
exclusão. O envio usa URL pré-assinada e vai direto do navegador para o S3; a
listagem lê o prefixo do usuário autenticado e devolve URLs de visualização
assinadas. É preciso configurar o bucket e `S3_BUCKET` (ver `infra/README.md`).

O cabeçalho do dashboard mostra "Galeria" ou "Perfil" no canto superior esquerdo,
em Geist Mono e com animação a cada troca de rota, e a foto e o nome do usuário
no canto direito. Clicar no usuário abre um menu com "Editar perfil" e "Galeria".
O botão vermelho de sair fica no rodapé, também à direita. Cada navegação exibe
um overlay de tela cheia (montado no `body`) com fundo escuro, e as páginas e
menus entram com animação (respeitando `prefers-reduced-motion`). Imagens
aparecem de uma vez, sem desenho progressivo. O modal de prévia de mídia fica
centralizado na janela e anima na abertura e no fechamento. Em
`/dashboard/perfil` foto, dados e edição ficam no mesmo card; clicar na foto abre
o seletor de arquivo (com ícone de pincel no hover). O usuário vê nome, username,
email, foto, descrição e data de criação, edita nome e descrição e altera a
senha. Username e email são somente leitura nesta versão.

Limites de upload: 50 MB por imagem, 500 MB por vídeo e 100 MB por documento.

## API de perfil

As rotas exigem login (cookie de sessão) e respondem `{ profile }` ou
`{ error }`. Os dados ficam no Cognito e a foto no S3, como nas telas. O perfil
devolvido não inclui a chave interna da foto.

| Método | Rota | Corpo (JSON) | Sucesso |
| --- | --- | --- | --- |
| `GET` | `/api/profile` | — | 200 `{ profile }` |
| `PATCH` | `/api/profile` | `{ fullName, description }` | 200 `{ profile }` |
| `PUT` | `/api/profile/avatar` | `{ key }` | 200 `{ profile }` |

Erros: 400 para dados inválidos, 401 sem sessão, 403 para foto de outro
usuário, 404 para foto ou perfil não encontrado, 415 sem
`Content-Type: application/json` e 500 para falhas de configuração ou da AWS.

Troca de foto pela API:

1. `POST /api/s3/presign-put` com `{ filename, contentType, size, scope: "avatar" }`
   devolve `{ putUrl, key }`.
2. O navegador envia o arquivo direto ao S3 com `PUT putUrl`.
3. `PUT /api/profile/avatar` com `{ key }` valida a imagem (até 5 MB), grava a
   chave e apaga a foto anterior.

A API não exige variável de ambiente nem permissão IAM além das já descritas.

## Implementado

- Cadastro com nome completo, username, email, senha e descrição; confirmação nativa por código em página própria, com o username pré-preenchido.
- Consulta prévia de email no servidor via `ListUsers`, com permissão IAM restrita.
- Requisitos de senha do Cognito verificados também pela aplicação no cadastro
  e na troca de senha.
- Login com email e senha, logout e página protegida de dashboard.
- Cookie HttpOnly, Secure em produção e SameSite=Lax, com duração do access token.
- JWT verificado no servidor e identidade baseada no `sub` do Cognito.
- Galeria no S3: upload direto por URL pré-assinada, listagem por usuário e
  exclusão restrita ao dono.
- Prévia de imagem e vídeo em modal, com opção de abrir o arquivo em nova aba.
- Perfil no Cognito: leitura via `GetUser`, edição de nome e descrição e troca de
  senha.
- Foto de perfil no S3 em `avatars/{userId}/`, com validação de imagem e remoção
  da foto anterior.
- API REST de perfil (`/api/profile` e `/api/profile/avatar`) e camadas de
  controller, serviço e repositório do perfil, usadas também pelas Server Actions.
- Testes automatizados sem chamadas reais à AWS.

Não há renovação automática de sessão; após expirar, é necessário entrar de novo.
MFA e outros desafios bloqueiam o login nesta versão. Logout tenta encerrar a
sessão no Cognito e sempre remove o cookie local; JWTs já emitidos podem continuar
válidos até expirar para verificadores offline.

Recuperação de senha e alteração de username/email permanecem fora desta
entrega. A data de criação depende de `AdminGetUser` com a permissão IAM
correspondente; sem ela, o perfil carrega com a data em branco. A validação com
User Pool e bucket S3 reais depende das variáveis de ambiente e da configuração
AWS.

A rede AWS está definida em Terraform e foi validada em uma conta de teste.
EC2 e deploy ainda estão pendentes. Consulte [Infraestrutura](infra/README.md).

## Backend de perfil: o que foi feito e como foi integrado

O backend de perfil implementa as camadas previstas na organização acima, sem
banco de dados novo: o perfil continua nos atributos do Cognito e a foto no S3.

```text
Telas (Server Actions) ─┐
API /api/profile ───────┴─> controller ─> serviço ─> repositório ─> Cognito
                                             └──────────────────────> S3 (foto)
```

**O que foi feito**

- `src/repositories/cognito-user.repository.ts`: lê e grava o perfil no Cognito
  e recusa acessar o perfil de outro usuário.
- `src/services/user.service.ts`: regras do perfil e da foto (dono do arquivo,
  imagem de até 5 MB, remoção do envio quando algo falha e da foto anterior). O
  perfil devolvido não inclui a chave interna da foto.
- `src/controllers/profile.controller.ts`: exige sessão verificada, valida a
  entrada com Zod, com mensagens em português, e traduz erros em status HTTP.
- `src/app/api/profile`: API REST de perfil (ver [API de perfil](#api-de-perfil)).
- 75 testes automatizados novos, sem chamadas à AWS.

**Como foi integrado**

- Reaproveita os adaptadores existentes (`src/lib/auth/profile.ts` e
  `src/lib/aws/s3.ts`) e a verificação de sessão (`src/lib/auth/session.ts`),
  sem alterá-los.
- As Server Actions de perfil (`src/app/actions/profile.ts`) passaram a usar o
  controller. O comportamento das telas não mudou: os testes de
  `tests/profile-actions.test.ts` foram escritos antes da mudança e passam antes
  e depois dela. A troca de senha continua como estava.
- Os contratos `UserRepository` e `UserService` foram ajustados ao perfil no
  Cognito. O repositório não cria usuários, porque o cadastro já é feito pelo
  Cognito.
- Não há variável de ambiente nem permissão IAM nova.

## O que falta (situação em 16/11/2026)

| Pendência | Por que importa |
| --- | --- |
| Teste manual do perfil com Cognito e S3 reais | Confirma de ponta a ponta o que os testes automatizados simulam |
| Revisão e merge do backend de perfil na `dev` | O código precisa da aprovação de outro integrante |
| 8 testes e 5 avisos de lint já quebrados na `dev` | `npm test` e `npm run lint` precisam passar antes da entrega |
| Merge da `dev` na `main` | A `main` é a branch padrão e ainda tem só o esqueleto |
| Rede aplicada na conta AWS final | O Terraform foi aplicado só em uma conta de teste, e o estado fica na máquina de quem o aplicou |
| Cognito e S3 na conta final | User Pool com os atributos do perfil e bucket com CORS para o endereço de produção |
| EC2 com IP público e IAM Role | O enunciado exige EC2 e IP público; sem a role, o cadastro falha |
| Implantação, proxy reverso e HTTPS | O Security Group libera só as portas 80 e 443, e o cookie de sessão exige HTTPS em produção |
| Título e introdução deste README | Ainda descrevem o esqueleto inicial |
| Envio dos links do repositório e da aplicação publicada | Exigência da entrega |

## Próximos passos para completar, integrar e publicar

1. **Testar o perfil manualmente.** Copiar `.env.example` para `.env.local`,
   preencher os dados do Cognito e do S3, rodar `npm run dev`, entrar e testar
   a tela `/dashboard/perfil` e a API pelo console do navegador:

   ```js
   await (await fetch("/api/profile")).json();
   await (await fetch("/api/profile", {
     method: "PATCH",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ fullName: "Nome Teste", description: "Editado pela API" }),
   })).json();
   ```

2. **Revisar e integrar o código.**
   - Revisar o PR do backend de perfil e fazer o merge na `dev` depois da
     aprovação.
   - Corrigir os testes quebrados (usar uma senha válida pela política atual) e
     os avisos de lint, até `npm test` e `npm run lint` passarem.
   - Fazer o merge da `dev` na `main`.

3. **Preparar a conta AWS final.**
   - Aplicar a rede com `infra/terraform` e guardar os outputs `vpc_id`,
     `subnet_id` e `security_group_id`.
   - Criar o User Pool e o App Client conforme `infra/cognito/README.md`.
   - Criar o bucket privado conforme `infra/README.md`, com CORS para a origem
     de produção.

4. **Criar a EC2** na sub-rede pública, com o grupo `tes-sg-web`, um IP elástico
   e uma IAM Role com:
   - `cognito-idp:ListUsers` e `cognito-idp:AdminGetUser` no User Pool;
   - `s3:ListBucket` no bucket e `s3:PutObject`, `s3:GetObject` e
     `s3:DeleteObject` em `uploads/*` e `avatars/*`.

   O SSH fica fechado por padrão; para usá-lo, definir `admin_ipv4_cidr` no
   Terraform.

5. **Implantar a aplicação na EC2**, com Node.js 22:

   ```bash
   git clone https://github.com/focarica/tes-aplicacao.git
   cd tes-aplicacao
   npm ci && npm run build
   cp -r public .next/standalone/
   cp -r .next/static .next/standalone/.next/
   PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js
   ```

   As variáveis do `.env.example` ficam no ambiente do serviço, sem credenciais
   AWS: a IAM Role da instância as fornece. O último comando deve rodar como
   serviço (por exemplo, com systemd), para voltar sozinho quando a máquina
   reiniciar.

6. **Configurar proxy reverso e HTTPS.** Um nginx na porta 443 encaminha as
   requisições para `127.0.0.1:3000`, e a porta 80 redireciona para HTTPS. O
   certificado pode ser emitido com Let's Encrypt (certbot) para um domínio
   apontado para o IP elástico. Sem HTTPS, o navegador descarta o cookie de
   sessão e o login não se mantém.

7. **Conferir e entregar.** No endereço público, testar cadastro, confirmação
   por e-mail, login, perfil, foto e galeria. Depois, enviar os links do
   repositório e da aplicação publicada.
