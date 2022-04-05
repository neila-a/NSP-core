const prog = require("commander");
const http = require("http");
const fs = require("fs");
const sh = require("shelljs");
prog
    .version("1.0.0")
    .command("run <dir>")
    .action(
        function (rundir) {
            const config = JSON.parse(sh.cat(`./${rundir}/nspconfig.json`));
            var server = http.createServer();
            server.on("request", function (req, res) {
                var { url } = req;
                console.log(config.on.request + url);
                if (url.charAt(url.length - 1) == "/") url += config.index;
                fs.readFile(
                    `./${rundir}${url}`,
                    function (err, data) {
                        if (err) {
                            console.log(err);
                            res.writeHead(404, { "Content-Type": "text/html" });
                        } else {
                            try {
                                var sp = data.toString().replace(
                                    /<\?node(.*?)\?>/gs,
                                    function (rr) {
                                        var data1 = rr.substring(6);
                                        var data = data1.substring(0, data1.length - 2);
                                        return eval(`
                                            (function () {
                                                ${data}
                                            })()
                                        `);
                                    }
                                );
                                res.writeHead(200, { "Content-Type": "text/html" });
                                res.write(sp);
                            } catch (err) {
                                console.error(err);
                                res.writeHead(503, { "Content-Type": "text/html" });
                            }
                        }
                        res.end();
                    }
                );
            });
            server.listen(config.port, eval(`
                (function () {
                    return ${config.on.listen}
                })()
            `));
        }
    )
    .parse(process.argv)
    ;