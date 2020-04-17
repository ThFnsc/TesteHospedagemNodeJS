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

Inclua no início do script start a seguinte string: `node testehospedagem &&`.
Então, se um script start tinha esse formato:
`node index`
Vai virar:
`node testehospedagem && node index`
Para reverter depois, pode ser manualmente ou automaticamente.
Para remover automaticamente, autentique a sua sessão (veja abaixo) e clique no botão `Terminar teste`. Esse botão vai remover o app de teste, remover o testehospedagem.js e o testehospedagem.json

## Se não existir um `package.json`

Pode copiar esse incluído mesmo

# Autenticação

* É necessário usar HTTPS para usar essa feature

Para poder acessar mais features como executar comandos e ver os valores das variáveis de ambiente, é necessário autenticar a sua sessão.
Cada novo acesso garantirá uma sessão para o navegador. Nos logs da aplicação mostrará essa nova sessão assim como um link que quando acessado autentica essa sessão.
Se o link for válido, será redirecionado de volta para o root e terá acesso as features