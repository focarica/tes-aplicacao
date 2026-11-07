# Controllers

Camada reservada aos futuros controllers de autenticação e perfil.

- Receber entradas das Server Actions ou Route Handlers e validá-las com Zod.
- Delegar regras aos services, sem acesso direto à persistência.
- Tratar erros e devolver apenas dados públicos; nunca retornar tokens ou senhas.
- Exigir sessão verificada no servidor em toda operação protegida.

Não existem endpoints ou controllers funcionais nesta etapa. Os contratos estão
em `src/services/`; não criar stubs que simulem autenticação bem-sucedida.
