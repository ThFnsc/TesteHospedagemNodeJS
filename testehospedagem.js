const http = require("http");
const childProcess = require("child_process");
const url = require('url');
const os = require("os");
const fs = require("fs");

const port = process.env.PORT || 3000;

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

restoreDados();
http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "text/html");

    var protocolo = req.headers["x-forwarded-proto"] || (req.connection.encrypted ? "https" : "http");
    var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    var parsedUrl = url.parse(req.url);

    var cookies = parseCookies(req.headers.cookie);
    var user;
    if (cookies.id)
        user = dados.sessions.find(s => s.id == cookies.id);
    if (!user)
        if (process.env.ENVIRONMENT == "dev" || protocolo == "https") {
            user = {
                id: randomBase64(30),
                confirmCode: randomBase64(30),
                trusted: false
            };
            dados.sessions.push(user);
            res.setHeader("Set-Cookie", `id=${user.id}; Max-Age=604800${process.env.ENVIRONMENT == "dev" ? "" : "; Secure"}`);
            saveDados();
        } else user = { trusted: false };
    if (!user.trusted)
        if (parsedUrl.path.substr(1) == user.confirmCode) {
            user.trusted = true;
            res.writeHead(302, {
                "Location": "/"
            });
            res.end();
            saveDados();
        } else
            console.log(`Para confiar no user de sessão ${user.id} (IP ${ip}) acesse: ${process.env.ENVIRONMENT == "dev" ? "http" : "https"}://${req.headers.host}/${user.confirmCode}`);

    console.log(`ip=${ip} method=${req.method} url=${req.url} user=${user.id}`);

    switch (parsedUrl.path) {
        case "/teste":
            return res.end("OK");
        case "/bash":
            if (!user.trusted) {
                res.statusCode = 401;
                return res.end("Não permitido");
            }
            var command = "";
            req.on("data", chunk => command += chunk);
            req.on("end", () => {
                console.log(`Executando comando "${command}"`);
                var child = childProcess.exec(command, (err, out, outerr) => res.end(`${err ? `${err}\n` : ""}\n${out}\n${outerr}`));
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
            });
            break;
        default:
            res.end(`<!DOCTYPE html>
    <html lang="pt">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>App de teste</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
            <style>
                .card-list {
                    max-height: 90vh;
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
                            ${user.trusted ? "" : "<p>Para ver os valores, acesse via HTTPS e de uma sessão de admin</p>"}
                            ${Object.entries(process.env).map(([key, value]) => `<div class="mb-3"><span class="badge badge-light key-badge">${escapeToHTML(key)}</span> ${user.trusted ? escapeToHTML(value) : ""}</div>`).join("\n")}
                        </div>
                    </div>


                    <div class="card bg-light text-dark card-list">
                        <div class="card-header">Executar comando</div>
                        <div class="card-body" >
                            ${user.trusted ?
                    `<textarea readonly class="bg-dark text-light w-100 text-monospace" style="height:40vh;" id="console">[Aguardando comando]</textarea>
            <input type="text" id="bash" class="form-control text-monospace" placeholder="ls -al">
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
                            <p>IP: ${ip}</p>
                            <p>Protocolo: ${protocolo}</p>
                            ${user.id ? `<p>Sessão: ${user.id.substr(0, user.id.length / 2)}[...]</p>` : `Não foi possível criar uma sessão pois a página foi carregada inseguramente`}
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
    </html>`);
    }
}).listen(port, () =>
    console.log(`Aplicação de teste rodando na porta ${port}`));