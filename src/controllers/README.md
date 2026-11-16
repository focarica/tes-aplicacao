# Controllers

Camada entre as entradas (Server Actions e Route Handlers) e os services.

- Receber entradas das Server Actions ou Route Handlers e validá-las com Zod.
- Delegar regras aos services, sem acesso direto à persistência.
- Tratar erros e devolver apenas dados públicos; nunca retornar tokens ou senhas.
- Exigir sessão verificada no servidor em toda operação protegida.

## Perfil

`profile.controller.ts` é o ponto de entrada do backend de perfil. É usado por
`src/app/actions/profile.ts` (telas) e por `src/app/api/profile` (API REST).

- Sessão: `getAuthenticatedUser` e `getAccessToken`; sem sessão, responde 401.
- Validação com Zod, com todas as mensagens em português.
- Monta, a cada requisição, o serviço de perfil (`createUserService`) com o
  repositório do Cognito (`createCognitoUserRepository`) do usuário logado.
- Devolve `ControllerResult<T>`: `{ ok: true, data }` ou
  `{ ok: false, status, error }`, com o status HTTP e a mensagem para o usuário.
  As actions usam só a mensagem; as rotas usam também o status.

A troca de senha continua em `src/app/actions/profile.ts`, e cadastro, login e
logout continuam nas Server Actions de autenticação, que usam os adaptadores
Cognito diretamente. O contrato de autenticação está em `src/services/`; não
criar stubs que simulem autenticação bem-sucedida.
