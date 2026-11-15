# Infraestrutura AWS

Terraform para criar VPC, sub-rede pública, Internet Gateway, tabela de rotas
e grupo de segurança. A configuração foi aplicada em uma conta de teste e
validada com um novo plano sem mudanças, rota ativa e regras HTTP/HTTPS.
Conectividade com a aplicação depende da futura EC2.

## Configuração

Requisito: Terraform >= 1.7 e < 2.0. Os arquivos ficam em `infra/terraform`.

- `main.tf`: provedor AWS, rede e grupo de segurança.
- `variables.tf`: configurações ajustáveis.
- `outputs.tf`: IDs dos recursos criados.
- `terraform.tfvars.example`: exemplo de valores locais.
- `tests/network.tftest.hcl`: testes com provedor simulado.
- `.terraform.lock.hcl`: versão e hashes do provedor instalado.

- Região padrão: `us-east-1`, configurável em `terraform.tfvars`.
- VPC: `10.0.0.0/16`; sub-rede: `10.0.1.0/24`.
- Rota `0.0.0.0/0` para o Internet Gateway, em tabela própria da sub-rede.
- Tags `Name`, `Project` e `ManagedBy`.
- Nomes padrão: `tes-vpc`, `tes-subnet-public`, `tes-igw`, `tes-rt-public`
  e `tes-sg-web`, com prefixo configurável por `project_name`.
- Sem atribuição automática de IP público; definir o endereço na etapa da EC2.

A autenticação usa o perfil AWS ou as credenciais temporárias do ambiente.
Não coloque credenciais nos arquivos Terraform. `.env.local` não é carregado.
A região usada é `aws_region` do Terraform, não a variável da aplicação.

`variables.tf` declara os valores padrão; `terraform.tfvars` define os valores
locais da implantação. Esses valores não precisam entrar no `.env.local` do Next.js.

| Variável | Padrão | Uso |
| --- | --- | --- |
| `aws_region` | `us-east-1` | Região da infraestrutura |
| `project_name` | `tes` | Prefixo dos nomes e tag Project |
| `availability_zone` | `null` | Opcional; a AWS seleciona uma zona |
| `admin_ipv4_cidr` | `null` | Opcional; IPv4 `/32` autorizado para SSH |

Selecione o perfil no terminal com `$env:AWS_PROFILE = "tes-projeto"`.

## Validação local

Na raiz do projeto:

```powershell
cd infra/terraform
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
terraform test
```

O `init` baixa o provedor e precisa de Internet. Os testes usam provedor AWS
simulado e não precisam de credenciais nem criam recursos na conta.

## Aplicação na AWS

Com credenciais autorizadas configuradas, confirme a conta e as restrições
do laboratório. Dentro de `infra/terraform`:

```powershell
Copy-Item terraform.tfvars.example terraform.tfvars
# Ajuste a região e os valores em terraform.tfvars.
terraform init
terraform plan "-out=rede.tfplan"
terraform apply "rede.tfplan"
terraform output
```

O `plan` consulta a AWS e mostra as mudanças; requer credenciais.
O `apply` executa o plano salvo. Gere outro plano se alterar a configuração.
O Terraform não adota recursos existentes apenas pelas tags; recursos criados
fora dele precisam de importação antes de serem gerenciados.

## Grupo de segurança

| Entrada TCP | Origem | Uso |
| --- | --- | --- |
| 80 | `0.0.0.0/0` | Redirecionamento HTTPS e ACME |
| 443 | `0.0.0.0/0` | Site HTTPS |
| 22, opcional | IPv4 administrativo `/32` | SSH |

A porta 3000 não é liberada. Para incluir SSH, defina `admin_ipv4_cidr`
em `terraform.tfvars` com o IP público real do administrador seguido de `/32`.
O padrão `null` mantém SSH fechado. Alterar o IP ou voltar a `null` atualiza
as regras gerenciadas no próximo apply. A saída IPv4 é permitida para instalação
de dependências e acesso aos serviços AWS.

## Estado e trabalho em equipe

O estado é local (`terraform.tfstate`) e não deve ir para o Git. Preserve-o
entre execuções: é ele que relaciona os arquivos aos recursos da conta.
`terraform.tfvars`, planos e `.terraform/` também são ignorados.
Versione `.terraform.lock.hcl`, que fixa a versão do provedor.

Nesta etapa, mantenham um responsável por executar Terraform no mesmo diretório
e estado. O colega recebe os outputs para criar a EC2; não deve aplicar esta
mesma rede em outro computador sem acesso ao estado original. Para execução
compartilhada, configurem um backend remoto com controle de acesso e bloqueio.

## Cognito e perfil

O perfil usa os atributos do User Pool, sem banco de dados próprio.
Configure `name`, `email`, `custom:description` e `custom:avatar_key`, incluindo
as permissões de leitura/escrita do App Client. Username e email são somente
leitura na aplicação atual. Cognito é regional e não fica dentro da VPC.

A IAM Role do servidor precisa de `cognito-idp:ListUsers` para o cadastro e
`cognito-idp:AdminGetUser` para a data de criação, restritos ao User Pool.
Consulte [Cognito](cognito/README.md) para a configuração completa.

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

## Validação e pendências

A identidade AWS precisa poder consultar, criar, atualizar e excluir os recursos
de rede e suas tags. Verifique as permissões disponíveis no laboratório.

Após aplicar, confira no console os CIDRs, gateway anexado, rota ativa,
associação da sub-rede e regras do grupo. Um novo `terraform plan` deve indicar
ausência de mudanças. A conectividade real depende da futura EC2.

Os outputs incluem `vpc_id`, `subnet_id` e `security_group_id` para o responsável
pelo servidor. Pendentes: EC2, IP público, associação do grupo, IAM Role e deploy
com HTTPS. Cognito e S3 precisam das configurações e permissões descritas acima.
A configuração Terraform atual provisiona somente a rede, não o User Pool nem o bucket.

Para remover a rede, remova primeiro a EC2 e outros recursos dependentes criados
pelo colega. Depois execute `terraform plan -destroy "-out=remocao.tfplan"`,
revise e execute `terraform apply "remocao.tfplan"` usando o estado original.
