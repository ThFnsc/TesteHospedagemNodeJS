Essa é uma aplicação de testes NodeJS para testar a funcionalidade de hospedagens.

 # Features

- Self-contained (é apenas esse arquivo e não requer nenhum módulo para funcionar)
 
 # Informações mostradas

- Variáveis de ambiente

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