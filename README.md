# TES — Esqueleto da aplicação

Base mínima em Next.js App Router, React e TypeScript.
A autenticação prevista é **AWS Cognito**, sem Supabase.

## Executar localmente

Requisito: Node.js 22 e npm.

```bash
git switch dev
npm ci
cp .env.example .env.local
npm run dev
```

Execute os comandos na raiz de `tes-aplicacao`. `dev` é a branch de
desenvolvimento, não uma subpasta.

Acesse http://localhost:3000. A página inicial não exige credenciais AWS.
As variáveis de ambiente serão necessárias ao implementar a integração.

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Organização (MVC adaptado ao Next.js)

```text
src/
  app/             Views, layouts e futuras entradas HTTP/Server Actions
  models/          Entidades e contratos de entrada/saída
  controllers/     Validação e coordenação das requisições (reservado)
  services/        Contratos de casos de uso e autenticação
  repositories/    Contrato de persistência do perfil
  lib/aws/         Integrações AWS (reservado)
infra/             Planejamento da rede e hospedagem AWS
```

Fluxo futuro: `View → Server Action/Route Handler → Controller → Service →
Repository/Adaptador AWS`. Não colocar regras de negócio nas páginas.
Os contratos são interfaces, não implementações nem autenticação simulada.

## Escopo preparado para o primeiro protótipo

- Cadastro e confirmação de usuário, login/logout e alteração de senha via Cognito.
- Dashboard protegido com menu e edição do próprio perfil.
- Perfil: nome completo, username, email, imagem, descrição e data de criação.
  A senha é entrada sensível do Cognito, nunca um atributo retornado do perfil.
- Autorização verificada no servidor em cada operação sobre dados do usuário.
- Hospedagem em EC2 com VPC, Security Groups, tabela de rotas e IP público.

Foram instalados SDK Cognito, verificador de JWT, Zod e proteção server-only.
Ainda não há formulários, rotas de autenticação, sessões, dashboard, banco,
uploads, testes funcionais ou infraestrutura provisionada. A escolha da
persistência do perfil fica para a próxima etapa. Consulte `infra/README.md`.
