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
- Mapear `name`, email e demais atributos suportados; decidir onde persistir
  descrição, imagem e metadados do perfil antes de implementar o repository.
- Definir se username será editável como atributo do perfil: o username nativo
  do Cognito é imutável. Alterações de email exigem fluxo de verificação.
- Cognito é um serviço gerenciado regional, não um processo dentro da VPC.
- Proteger dashboard e operações de perfil no servidor, não apenas na interface.

## Pendências

Escolher persistência do perfil, estratégia de imagem (URL ou upload), criar
infraestrutura como código, configurar backups/observabilidade, automatizar
deploy e validar autorização por usuário. Nada disso é executado nesta etapa.
