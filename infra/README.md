# Planejamento AWS (sem provisionamento)

Esta pasta registra a estrutura esperada. Não contém recursos criados,
credenciais ou scripts de implantação. Região e CIDRs são exemplos a validar.

## Rede e hospedagem

```text
Internet → Internet Gateway → VPC (10.0.0.0/16)
  └─ Sub-rede pública (10.0.1.0/24)
       ├─ Tabela de rotas: rota local + 0.0.0.0/0 → Internet Gateway
       └─ EC2 + Security Group + Elastic IP
            └─ Proxy HTTPS → Next.js (porta interna 3000)

EC2 → HTTPS → Cognito User Pool + App Client
```

- Criar VPC, sub-rede pública e Internet Gateway associado à VPC.
- Associar explicitamente a tabela de rotas à sub-rede.
- Criar EC2 para executar o build standalone do Next.js com Node.js 22.
- Associar Elastic IP à instância para acesso público estável.
- Security Group: liberar 443 para Internet; 80 somente para redirect/ACME;
  22 somente do IP administrativo, ou usar SSM em vez de SSH.
- Não expor a porta 3000 à Internet. Restringir saída aos serviços necessários.
- Configurar DNS, certificado TLS, proxy reverso e supervisão do processo.
- Usar IAM Role na EC2 com mínimo privilégio; nenhum segredo no repositório.
- Avaliar custos de EC2, armazenamento e IPv4 público antes de provisionar.

## Cognito

- Criar User Pool e App Client; definir cadastro, confirmação de email,
  políticas de senha, recuperação de conta, MFA e fluxos de autenticação.
- Usar `sub` como identificador estável. Não usar email/username como chave.
- Mapear `name`, email e os atributos customizados `custom:description` e
  `custom:avatar_key`; o perfil não usa banco de dados próprio.
- Definir se username será editável como atributo do perfil: o username nativo
  do Cognito é imutável. Alterações de email exigem fluxo de verificação.
- Cognito é um serviço gerenciado regional, não um processo dentro da VPC.
- Proteger dashboard e operações de perfil no servidor, não apenas na interface.

## S3 (galeria)

- Criar um bucket privado na mesma região do app, com Block Public Access,
  criptografia padrão e ACLs desabilitadas.
- CORS para a origem do app (`http://localhost:3000` em desenvolvimento):
  `PUT`, `GET` e `HEAD`, com `ETag` exposto.
- Identidade do servidor com `s3:ListBucket` no bucket e `s3:PutObject`,
  `s3:GetObject` e `s3:DeleteObject` em `uploads/*` e `avatars/*`.
- Prefixo por usuário (`uploads/{userId}/`), verificado no servidor antes de
  assinar ou excluir. Sem banco de metadados: a listagem vem do próprio S3.
- Fotos de perfil em `avatars/{userId}/`, com URL assinada e remoção da foto
  anterior; a chave fica em `custom:avatar_key` no Cognito.
- Configurar `S3_BUCKET` em `.env.local`. Adicionar a origem de produção ao
  CORS e considerar expiração/ciclo de vida para objetos órfãos.

## Pendências

Criar infraestrutura como código, configurar backups/observabilidade,
automatizar deploy e validar autorização por usuário. Nada disso é executado
nesta etapa.
