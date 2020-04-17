/*Essa é uma aplicação de testes NodeJS para testar a funcionalidade de hospedagens.

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
*/

const http = require("http");
const childProcess = require("child_process");
const url = require('url');
const os = require("os");
const fs = require("fs");

var dados;

function saveDados() {
    fs.writeFile("testehospedagem.json", JSON.stringify(dados, null, 2), () => { });
}

function restoreDados() {
    try {
        dados = JSON.parse(fs.readFileSync("testehospedagem.json"));
    } catch (err) {
        console.error("Não foi possível buscar dados salvos");
    } finally {
        if (!dados)
            dados = { sessions: [] };
    }
}

if (process.env.ENVIRONMENT == "dev")
    console.log("Iniciando em ambiente de desenvolvimento");

const magnitudeDados = {
    "TB": Math.pow(1024, 4),
    "GB": Math.pow(1024, 3),
    "MB": Math.pow(1024, 2),
    "KB": Math.pow(1024, 1),
    "B": Math.pow(1024, 0),
};

/**
 * 
 * @param {Number} valor 
 * @param {Object} lista 
 */
function formatarMagnitude(valor, lista, maxDigits) {
    for (var [nome, start] of Object.entries(lista))
        if (valor >= start)
            return `${(valor / start).toFixed(maxDigits == undefined ? 2 : maxDigits)}${nome}`;
}

/**
 * 
 * @param {Number} m 
 * @param {Number} n 
 */
function ackermann(m, n) {
    return m === 0 ? n + 1 : ackermann(m - 1, n === 0 ? 1 : ackermann(m, n - 1));
}

/**
 * 
 * @param {Number} bytes 
 */
function randomBase64(bytes) {
    return Buffer.from(new Array(bytes).fill(0).map(() => Math.random() * 256)).toString("base64").replace(/\//g, "-").replace(/\+/g, "_")
}

function benchmark() {
    var start = Date.now();
    ackermann(3, 10);
    return (Date.now() - start);
}

/**
 * 
 * @param {String} val 
 */
var escapeToHTML = (val) =>
    val.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

/**
 * 
 * @param {String} cookies 
 */
function parseCookies(cookies) {
    var parsed = {};
    (cookies || "").split(";").map(v => v.trim()).forEach(v => parsed[v.split("=")[0]] = v.split("=")[1]);
    return parsed;
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {Function} gotUserCallback 
 */
function getUser(req, res, gotUserCallback) {
    if (req.cookies.id)
        req.user = dados.sessions.find(s => s.id == req.cookies.id);
    if (!req.user)
        if (process.env.ENVIRONMENT == "dev" || req.protocol == "https") {
            req.user = {
                id: randomBase64(30),
                confirmCode: randomBase64(30),
                trusted: false
            };
            dados.sessions.push(req.user);
            res.setHeader("Set-Cookie", `id=${req.user.id}; Max-Age=604800${process.env.ENVIRONMENT == "dev" ? "" : "; Secure"}`);
            saveDados();
        } else req.user = { trusted: false };
    if (!req.user.trusted)
        if (req.parsedUrl.path.substr(1) == req.user.confirmCode) {
            req.user.trusted = true;
            res.writeHead(302, {
                "Location": "/"
            });
            res.end();
            return saveDados();
        }
    gotUserCallback();
}

/**
 *
 * @param {Request} req
 * @param {Response} res
 */
function authorized(req, res) {
    if (req.user.trusted)
        return true;
    if (res) {
        res.statusCode = 401;
        res.end("Unauthorized");
    }
    return false;
}

/**
 * 
 * @param {Boolean} remove 
 */
function packageCorreto(remove) {
    var package = JSON.parse(fs.readFileSync("package.json"));
    var comandos = package.scripts.start.split("&&").map(comando => comando.trim());
    if (comandos[0].match(/^node testehospedagem(\.js)?$/)) {
        if (remove) {
            package.scripts.start = comandos.slice(1).join(" && ");
            fs.writeFileSync("package.json", JSON.stringify(package, null, 2));
            ["testehospedagem.js", "testehospedagem.json"].forEach(fs.unlinkSync);
        }
        return true;
    } else
        return false;
}

if (!packageCorreto())
    console.log("ATENÇÃO!!!\nO script start do package.json NÃO ESTÁ CORRETO PARA ALGUMAS FUNCIONALIDADES DESSA APLICAÇÃO!")

restoreDados();
var server = http.createServer((req, res) => {
    if (req.url == "/favicon.ico")
        return res.end();
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "text/html");

    req.ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    req.protocol = req.headers["x-forwarded-proto"] || (req.connection.encrypted ? "https" : "http");
    req.parsedUrl = url.parse(req.url);
    req.cookies = parseCookies(req.headers.cookie);
    req.user = getUser(req, res, () => {
        console.log(`Request:\n${Object.entries({
            ip: req.ip,
            method: req.method,
            url: req.url,
            user: req.user.id,
            autenticado: req.user.trusted ? "sim" : `não; ${process.env.ENVIRONMENT == "dev" ? "http" : "https"}://${req.headers.host}/${req.user.confirmCode}`
        }).map(([key, value]) => `    ${key}=${value}`).join("\n")}\n----------------------------`);

        switch (req.parsedUrl.path) {
            case "/teste":
                return res.end("OK");
            case "/bash":
                if (authorized(req, res)) {
                    var command = "";
                    req.on("data", chunk => command += chunk);
                    req.on("end", () => {
                        console.log(`Executando comando "${command}"`);
                        var child = childProcess.exec(command, (err, out, outerr) => res.end(`${err ? `${err}\n` : ""}\n${out}\n${outerr}`));
                        child.stdout.pipe(process.stdout);
                        child.stderr.pipe(process.stderr);
                    });
                }
                break;
            case "/stop":
                if (authorized(req, res)) {
                    console.log("Terminando app de teste");
                    res.end(() => process.exit(0));
                }
                break;
            case "/delete":
                if (authorized(req, res)) {
                    if (packageCorreto(true)) {
                        console.log("Terminando app de teste e removendo até do package.json");
                        res.end(() => process.exit(0));
                    } else {
                        res.statusCode = 500;
                        res.end("Package.json incorreto");
                    }
                }
                break;
            default:
                res.end(index(req));
        }
    });
}).listen(process.env.PORT || 3000, () =>
    console.log(`Aplicação de teste rodando na porta ${server.address().port}`));

function index(req) {
    return `<!DOCTYPE html>
    <html lang="pt">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>App de teste</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
            <style>
                .card-list {
                    max-height: 50vh;
                    overflow: auto;
                }

                .key-badge{
                    display: initial;
                    white-space: normal;
                }
            </style>
            <script>
                if (window.location.protocol != "https:")
                    fetch("https://" + window.location.host + "/teste").then(res => { if (res.statusText == "OK") window.location.protocol = "https:"; }).catch(err => console.log("HTTPS indisponível")) //Redirecionar para HTTPS se disponível
                else
                    console.log("HTTPS OK")
            </script>
        </head>
        <body class="bg-dark text-white">
            <div class="container mt-5">
                <div class="card-columns">


                    <div class="card bg-info">
                        <img class="card-img-top" src="https://media.giphy.com/media/YnBntKOgnUSBkV7bQH/giphy.gif">
                        <div class="card-body">
                            <h5 class="card-title">Hello world!</h5>
                            <p class="card-text">Parabéns, sua hospedagem NodeJS está online!</p>
                        </div>
                    </div>


                    <div class="card bg-primary card-list">
                        <div class="card-header">Variáveis de ambiente</div>
                        <div class="card-body text-monospace text-white" >
                            ${req.user.trusted ? "" : "<p>Para ver os valores, acesse via HTTPS e de uma sessão de admin</p>"}
                            ${Object.entries(process.env).map(([key, value]) => `<div class="mb-3"><span class="badge badge-light key-badge">${escapeToHTML(key)}</span> ${req.user.trusted ? escapeToHTML(value) : ""}</div>`).join("\n")}
                        </div>
                    </div>


                    <div class="card bg-light text-dark">
                        <div class="card-header">Executar comando</div>
                        <div class="card-body" >
                            ${authorized(req) ?
            `<textarea readonly class="bg-dark text-light w-100 text-monospace" style="height:40vh;" id="console">[Aguardando comando]</textarea>
            <input type="text" id="bash" class="form-control text-monospace" placeholder="ls -al">
            <div class="mt-4">
                ${packageCorreto() ?
                `<button onclick="stopApp()" class="btn btn-success" title="Para esse app e inicia o app principal">Iniciar app</button>
                    <button onclick="deleteApp()" class="btn btn-danger" title="O app de teste se remove até do package.json e inicia a aplicação principal">Terminar teste</button>`
                :
                `<p>O formato do script start do package.json está incorreto. Deve estar no seguinte formato:<br>
                    node testehospedagem && &lt;comando original&gt;</p>`
            }
            </div>
            <script>
                var inputBash=document.getElementById("bash");
                inputBash.addEventListener("keyup", e=>{
                    if(e.keyCode==13){
                        var output = document.getElementById("console");
                        output.value="[Executando...]";
                        fetch("/bash", {
                            body: inputBash.value,
                            method: "post"
                        }).then(res=>{
                            res.text().then(text=> output.value=text);
                        }).catch(err=>{
                            output.value="ERRO NO FETCH: "+JSON.stringify(err);
                        });
                        inputBash.value="";
                    }
                });

                function stopApp(){
                    fetch("/stop").then(()=>setTimeout(()=>window.location.reload(),3000)).catch(alert);
                }

                function deleteApp(){
                    if(confirm("Essa ação removerá todos os resquícios desse app de teste. Incluindo a parte do script start que inicia ele.\\nTem certeza que deseja continuar?"))
                        fetch("/delete").then(()=>setTimeout(()=>window.location.reload(),3000)).catch(alert);
                }
            </script>`
            :
            `<p>Você não tem permissão para esse recurso no momento</p>`}
                        </div>
                    </div>


                    <div class="card bg-success">
                        <div class="card-header">Stats</div>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item bg-success">
                                <label>RAM</label>
                                <ul>
                                    ${
        function () {
            var mem = process.memoryUsage();
            mem["Total OS"] = os.totalmem();
            mem["Total livre OS"] = os.freemem();
            return Object.entries(mem).sort(([keyA], [keyB]) => keyA < keyB).map(([key, val]) => `<li>${key}: ${formatarMagnitude(val, magnitudeDados)}</li>`).join("\n");
        }()}
                                </ul>
                            </li>
                            <li class="list-group-item bg-success">OS: ${os.platform()}</li>
                            <li class="list-group-item bg-success">CPU Benchmark: ${((1 / benchmark()) * 166666).toFixed(0)}pt</li>
                        </ul>
                    </div>


                    <div class="card bg-danger card-list">
                        <div class="card-header">Headers do navegador</div>
                        <div class="card-body">
                            ${Object.entries(req.headers).map(([key, value]) => `<span class="badge badge-light key-badge">${key}</span> ${value}<br>`).join("\n")}
                        </div>
                    </div>


                    <div class="card bg-light text-dark card-list">
                        <div class="card-header">Dados do seu acesso</div>
                        <div class="card-body">
                            <p>IP: ${req.ip}</p>
                            <p>Protocolo: ${req.protocol}</p>
                            ${req.user.id ? `<p>Sessão: ${req.user.id.substr(0, req.user.id.length / 2)}[...]</p>` : `Não foi possível criar uma sessão pois a página foi carregada inseguramente`}
                        </div>
                    </div>


                    <div class="card bg-warning card-list text-dark">
                        <div class="card-header">Conteúdo da node_modules</div>
                        <div class="card-body">
                                    ${
        function () {
            var dependencias = [];
            try {
                dependencias = Object.keys(JSON.parse(fs.readFileSync("package.json")).dependencies);
            } catch (e) { }
            try {
                return `<ul>${(fs.readdirSync("node_modules").sort((a, b) => dependencias.includes(b) - dependencias.includes(a)).map(pasta => `<li class="${dependencias.includes(pasta) ? "font-weight-bold" : ""}">${pasta}</li>`)).join("\n")}</ul>`;
            } catch (e) {
                switch (e.code) {
                    case "ENOENT":
                        return "Não existe a pasta node_modules";
                    case "ENOTDIR":
                        return "node_modules não é uma pasta";
                    default:
                        return JSON.stringify(e);
                }
            }
        }()}
                        </div>
                    </div>
                </div>
            </div>
            <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
            <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
        </body>
    </html>`;
}