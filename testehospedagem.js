const http = require("http");
const url = require('url');
const os = require("os");
const fs = require("fs");

const port = process.env.PORT || 3000;

const magnitudeDados = {
    "TB": Math.pow(1024, 4),
    "GB": Math.pow(1024, 3),
    "MB": Math.pow(1024, 2),
    "KB": Math.pow(1024, 1),
    "B": Math.pow(1024, 0),
};

var permissoesPendentes = [];
var IPsPermitidos = ["::1"];

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


http.createServer((req, res) => {
    var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    var permitido = IPsPermitidos.includes(ip);
    var trusted = permitido && req.headers["x-forwarded-proto"] != "http";
    var parsedUrl = url.parse(req.url);

    console.log(`${ip} ${req.method} ${req.url}`);

    if (!permitido) {
        var pendente = permissoesPendentes.find(pendente => pendente.ip == ip);
        if (pendente && parsedUrl.path.substr(1) == pendente.code && pendente.ip == ip) {
            IPsPermitidos.push(pendente.ip);
            permissoesPendentes = permissoesPendentes.filter(el => el != pendente);
            res.writeHead(302, {
                "Location": "/"
            });
            res.end();
            return;
        } else if (!pendente) {
            pendente = {
                ip: ip,
                code: Buffer.from(new Array(60).fill(0).map(() => Math.random() * 256)).toString("base64").replace(/\//g, "-").replace(/\+/g, "_")
            };
            permissoesPendentes.push(pendente);
        }
        console.log(`Para confiar no IP ${ip} acesse: https://${req.headers.host}/${pendente.code}`);
    }
    res.statusCode = 200;
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "text/html");
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
                            ${trusted ? "" : "<p>Para ver os valores, acesse via HTTPS e de um IP whitelistado</p>"}
                            ${Object.entries(process.env).map(([key, value]) => `<div class="mb-3"><span class="badge badge-light key-badge">${escapeToHTML(key)}</span> ${trusted ? escapeToHTML(value) : ""}</div>`).join("\n")}
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
                        <div class="card-header">Seu IP</div>
                        <div class="card-body">
                            ${ip}
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
            <script src="https://cdnjs.cloudflare.com/aaajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
            <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
        </body>
    </html>`);
}).listen(port, () =>
    console.log(`Aplicação de teste rodando na porta ${port}`));