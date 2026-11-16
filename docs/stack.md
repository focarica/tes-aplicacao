# Stack tecnológica

Versões conforme `package.json` (as faixas `^` aceitam atualizações compatíveis; o `package-lock.json` fixa as instaladas).

## Aplicação

| Tecnologia | Versão | Papel no projeto |
| --- | --- | --- |
| Node.js | 22 (`.nvmrc`; `engines: >=22`) | Ambiente de execução |
| Next.js (App Router) | 16.4.5 | Framework full-stack: telas, Server Actions e Route Handlers; build `standalone` |
| React | 19.3.1 | Interface |
| TypeScript | 5.x | Tipagem estática (`tsc --noEmit`) |
| Tailwind CSS | 4.3.x | Estilos, com a paleta definida em `src/app/globals.css` (parchment, cream, sand, espresso, latte) |
| Zod | 4.x | Validação de entrada e das variáveis de ambiente |
| Geist Mono | — | Fonte do título do cabeçalho do dashboard |

## AWS

| Serviço / biblioteca | Papel |
| --- | --- |
| Cognito (`@aws-sdk/client-cognito-identity-provider`) | Cadastro, confirmação por e-mail, login, perfil e troca de senha |
| `aws-jwt-verify` | Verificação criptográfica do access token no servidor |
| S3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) | Armazenamento privado e URLs pré-assinadas de upload e visualização |
| IAM | Role da EC2 com as permissões mínimas para Cognito e S3 (ver [infra/README.md](../infra/README.md)) |
| VPC, sub-rede, Internet Gateway, Security Group | Rede da aplicação, definida em Terraform |
| EC2 | Hospedagem da aplicação, atrás do nginx com HTTPS |

## Qualidade e ferramentas

| Ferramenta | Uso |
| --- | --- |
| Vitest 5 + jsdom | Testes unitários e de fluxo |
| Testing Library (`react`, `user-event`) | Testes de componentes |
| ESLint 9 + `eslint-config-next` | Lint (`--max-warnings=0`) |
| Terraform `>= 1.7, < 2.0` (provedor AWS `~> 6.0`) | Infraestrutura como código e `terraform test` com provedor simulado |
| `server-only` | Impede que módulos sensíveis sejam importados no navegador |

## Em produção

A aplicação está publicada em <https://32-194-55-125.sslip.io>: nginx como proxy reverso na porta 443, com certificado Let's Encrypt, e a porta 80 redirecionando para HTTPS. Ver [deploy-e-pendencias.md](deploy-e-pendencias.md).
