# Deploy, pendências e limitações

Situação em **16/11/2026**.

## Estado do projeto

| Item | Estado |
| --- | --- |
| Aplicação (cadastro, login, galeria, perfil, API) | Implementada; validada com testes que simulam a AWS |
| Rede AWS em Terraform | Aplicada e validada em uma conta de teste |
| Cognito e S3 | Configuração documentada; criados manualmente (não estão no Terraform) |
| EC2, IP público, proxy reverso e HTTPS | Publicada em <https://32-194-55-125.sslip.io>: EC2 com IP elástico 32.194.55.125 e IAM Role `ec2-app-role`, nginx com certificado Let's Encrypt, e HTTP redireciona para HTTPS. Diagrama em [arquitetura.md](arquitetura.md#infraestrutura) |
| Versão publicada | Anterior ao backend de perfil: `/api/profile` responde 404 no servidor (conferido em 16/11/2026) |
| Teste de ponta a ponta no endereço publicado | Pendente |

## Pendências

| Pendência | Por que importa |
| --- | --- |
| Publicar de novo a partir da `main` atual | O servidor roda um build anterior ao merge do backend de perfil; `/api/profile` e `/api/profile/avatar` respondem 404 |
| Teste de ponta a ponta no endereço publicado | Confirma cadastro, login, galeria, perfil e foto com o Cognito e o S3 reais |
| 8 testes e 5 avisos de lint | `npm test` e `npm run lint` precisam passar (ver [Problemas conhecidos](#problemas-conhecidos)) |
| Confirmar a conta e o estado do Terraform da produção | O Terraform foi validado em uma conta de teste, e o estado fica na máquina de quem o aplicou |

## Publicar uma nova versão

Na EC2, dentro da pasta do projeto:

```bash
git pull
npm ci && npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

Depois, reinicie o serviço que executa `node .next/standalone/server.js`. As variáveis de ambiente e as permissões não mudam.

## Roteiro de deploy

Referência para montar o ambiente do zero.

### 1. Preparar a conta AWS

- Aplicar a rede (`infra/terraform`) e guardar `vpc_id`, `subnet_id` e `security_group_id`. Ver [infra/README.md](../infra/README.md).
- Criar o User Pool e o App Client conforme [infra/cognito/README.md](../infra/cognito/README.md).
- Criar o bucket privado conforme [infra/README.md](../infra/README.md#s3-galeria), com CORS para a origem de produção.

### 2. Criar a EC2

Na sub-rede pública, com o grupo `tes-sg-web`, IP elástico e uma IAM Role com:

- `cognito-idp:ListUsers` e `cognito-idp:AdminGetUser` no User Pool;
- `s3:ListBucket` no bucket e `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` em `uploads/*` e `avatars/*`.

O SSH fica fechado por padrão; para usá-lo, defina `admin_ipv4_cidr` no Terraform.

### 3. Implantar a aplicação (Node.js 22)

```bash
git clone https://github.com/focarica/tes-aplicacao.git
cd tes-aplicacao
npm ci && npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

As variáveis do `.env.example` ficam no ambiente do serviço, **sem credenciais AWS**: a IAM Role da instância as fornece. Execute o último comando como serviço (por exemplo, systemd) para voltar sozinho após reiniciar.

### 4. Proxy reverso e HTTPS

nginx na porta 443 encaminha para `127.0.0.1:3000`; a porta 80 redireciona para HTTPS. Emita o certificado com Let's Encrypt (certbot) para um domínio apontado para o IP elástico. Sem HTTPS o navegador descarta o cookie de sessão e o login não se mantém.

### 5. Conferir e entregar

No endereço público, teste cadastro, confirmação por e-mail, login, perfil, foto e galeria.

## Limitações da versão atual

- Sem renovação automática de sessão; ao expirar, é preciso entrar de novo.
- MFA e outros desafios de autenticação bloqueiam o login.
- O logout encerra a sessão no Cognito e remove o cookie, mas JWTs já emitidos podem continuar válidos até expirar para verificadores offline.
- Recuperação de senha e alteração de username ou e-mail estão fora do escopo.
- A data de criação do perfil depende de `AdminGetUser`; sem a permissão, aparece em branco.
- Estado do Terraform local: um único responsável deve aplicar a rede, ou a equipe deve configurar backend remoto com bloqueio.
- O Terraform cobre apenas a rede; Cognito, S3, EC2 e IAM são manuais.

## Problemas conhecidos

Encontrados ao rodar as verificações na branch `dev` em 16/11/2026:

| Problema | Detalhe | Correção sugerida |
| --- | --- | --- |
| 8 testes falham | `tests/auth.test.ts` (1) e `tests/signup-action.test.ts` (7) usam a senha `"senha-simples"`, que não cumpre a política de `cognitoPasswordSchema` | Trocar a senha dos testes por uma válida, por exemplo `"Senha-Forte1!"` |
| `npm run lint` falha | 5 avisos `@next/next/no-img-element` em `GalleryClient`, `Uploader`, `password-field` e `PasswordForm`, com `--max-warnings=0` | Usar `next/image` ou justificar com um `eslint-disable` pontual (as URLs são assinadas do S3) |

## Histórico: backend de perfil

O backend de perfil foi integrado sem banco de dados novo, reaproveitando os adaptadores existentes (`src/lib/auth/profile.ts`, `src/lib/aws/s3.ts`, `src/lib/auth/session.ts`). As Server Actions de perfil passaram a usar o controller sem mudar o comportamento das telas (os testes de `tests/profile-actions.test.ts` passam antes e depois). Não houve variável de ambiente nem permissão IAM nova. Arquitetura em [arquitetura.md](arquitetura.md).
