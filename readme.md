Essa é uma aplicação de testes NodeJS para testar a funcionalidade de hospedagens.

 # Features

- Self-contained (é apenas esse arquivo e não requer nenhum módulo para funcionar)

- Possível executar comandos diretamente pelo navegador. Alternativa a conectar por SSH (requer autenticação)

 # Informações mostradas

- Variáveis de ambiente (requer autenticação para ver os valores)

- Stats de RAM

- Nome do OS

- Benchmark básico de CPU

- Headers enviados pelo navegador

- IP que fez o acesso

- Lista dos módulos instalados na node_modules (se existir) com os módulos principais em negrito (usa o package.json como referência)

# Instalação

Copie o arquivo `testehospedagem.js` para os arquivos da hospedagem

## Se existir um `package.json`

Substitua temporariamente o comando do script start para `node testehospedagem`.
Retorne de volta para o comando antigo depois que os testes terminarem

## Se não existir um `package.json`

Pode copiar esse incluído mesmo

# Autenticação

* É necessário usar HTTPS para usar essa feature

Para poder acessar mais features como executar comandos e ver os valores das variáveis de ambiente, é necessário autenticar a sua sessão.
Cada novo acesso garantirá uma sessão para o navegador. Nos logs da aplicação mostrará essa nova sessão assim como um link que quando acessado autentica essa sessão.
Se o link for válido, será redirecionado de volta para o root e terá acesso as features