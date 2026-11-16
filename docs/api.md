# API HTTP

Todas as rotas exigem login (cookie de sessão `tes_access_token`) e respondem JSON. Sem sessão válida, devolvem **401**.

## Perfil

Respondem `{ "profile": ... }` ou `{ "error": "mensagem" }`. O perfil não inclui a chave interna da foto.

| Método | Rota | Corpo (JSON) | Sucesso |
| --- | --- | --- | --- |
| `GET` | `/api/profile` | — | 200 `{ profile }` |
| `PATCH` | `/api/profile` | `{ fullName, description }` | 200 `{ profile }` |
| `PUT` | `/api/profile/avatar` | `{ key }` | 200 `{ profile }` |

Formato de `profile`:

```json
{
  "id": "sub-do-cognito",
  "fullName": "Ana Silva",
  "username": "ana",
  "email": "ana@example.com",
  "profileImageUrl": "https://...assinada...",
  "description": "Fotógrafa",
  "createdAt": "2026-11-16T12:00:00.000Z"
}
```

| Status | Quando |
| --- | --- |
| 400 | Dados inválidos |
| 401 | Sem sessão |
| 403 | Foto de outro usuário |
| 404 | Foto ou perfil não encontrado |
| 415 | Falta `Content-Type: application/json` |
| 500 | Falha de configuração ou da AWS |

## Upload (galeria e foto de perfil)

### `POST /api/s3/presign-put`

Corpo:

```json
{ "filename": "foto.png", "contentType": "image/png", "size": 123456, "scope": "gallery" }
```

`scope` é `"gallery"` (padrão) ou `"avatar"`. Resposta: `{ "putUrl": "...", "key": "..." }`. A URL vale **5 minutos**. Erros: 400 (tipo ou tamanho não permitido), 401, 500.

Troca de foto pela API, em 3 passos:

1. `POST /api/s3/presign-put` com `scope: "avatar"`.
2. `PUT putUrl` com o arquivo, direto no S3 (com o mesmo `Content-Type`).
3. `PUT /api/profile/avatar` com `{ key }`: valida a imagem (até 5 MB), grava a chave e apaga a foto anterior.

## Arquivos da galeria

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/files` | Lista os arquivos do usuário: `{ files: FileRecord[] }`, cada um com `viewUrl` assinada por 1 hora |
| `DELETE` | `/api/files?key=<chave>` | Exclui um arquivo do próprio usuário: `{ ok: true }` |

Erros: 400 (`key` inválida), 401, 403 (arquivo de outro usuário), 500 (armazenamento não configurado ou falha da AWS).

## Limites de upload

| Tipo | Máximo | Formatos |
| --- | --- | --- |
| Imagem | 50 MB | `image/*` |
| Vídeo | 500 MB | `video/*` |
| Documento | 100 MB | PDF, ZIP, TXT, DOC, DOCX |
| Foto de perfil | 5 MB | JPEG, PNG, WebP, GIF |

## Autenticação, cadastro e senha

Cadastro, confirmação, login, logout e troca de senha **não são rotas REST**: são Server Actions (`src/app/actions/`) chamadas pelos formulários.
