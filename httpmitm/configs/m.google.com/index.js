const net = require('net');
const handlers = require('../../handlers');
const path = require('path');
const express = require('express');

const url = require('url');
const child_proc = require('child_process');
const fs = require('fs');
const state = { pid: null };
/**
 * 
 * @param {import("../../proxy").FilterInfo} f 
 */
function filter(f) {
    console.log("hi");
    if (f.tls) {
        return true;
    }
    return false;
}
async function startServerIfNeeded() {
    return; // run the python3 srv manually for now
    let realpath = path.resolve('.', 'dmbackend', 'start_server.sh')
    let prc = child_proc.spawn("/bin/bash", [path.resolve('.', 'dmbackend', 'start_server.sh'), realpath], {stdio: "pipe"});
    let wstream = fs.createWriteStream("./int_server.log");
    let pidPath = path.resolve(path.dirname(realpath), "pid");
    try {
    fs.rmSync(pidPath);
    } catch {};
    prc.stdout.pipe(wstream);
    
    prc.stderr.pipe(wstream);
    // prc.stdout.once("data", async (c) => {
        // let pid = 0;
        // console.log("Started as PID: "+ (pid = parseInt(c.toString('utf-8').split("Server PID: ")[1].split('\n')[0])));
        // state.pid = pid;
        let buffer = null;
        while (true) {
            if ((buffer = await new Promise((resolve)=>{
                fs.readFile(pidPath, (err, data)=>{
                    if (err)
                        resolve(null);
                    else {
                        resolve(data);
                    }
                })
            }))) {
                break;
            }
        }
        state.pid = parseInt(buffer.toString('utf-8'));

      await new Promise((resolve)=>setTimeout(resolve, 200));
    // })
    console.log("Started internal server with pid of: " + state.pid);
}
const app = express();
app.post("/*", async function (req, res) {
    console.log("Reading a post request")
    console.log(req.header('Content-Length'));
    var a = parseInt(req.header('Content-Length'))
    const dat = Buffer.alloc(a);
    var ptr = 0;
    async function handle() {
        console.log("handling: " + url.parse(req.url).search);
        try {
            // console.log(new URL(req.path).search);
            fetch = (await import('node-fetch')).default;
            await startServerIfNeeded();

            const resFromRev = await fetch('http://127.0.0.1:3040/' + url.parse(req.url).search, {
                body: dat,
                "headers": req.headers,
                method: "POST"
            });
            // console.log(resFromRev.data);
            res.header('Content-Type', 'application/x-protobuffer');
            res.writeHead(resFromRev.status, resFromRev.statusText);
            res.end(new Uint8Array((await resFromRev.arrayBuffer())));
        } catch (e) {
            if (!e.response) {
                console.log("Error occured here without a response. Weird.");
                console.log(e);
                res.writeHead(500, 'Internal server error');
                res.end('An error has occured');
                return;
            }
            res.header('Content-Type', "application/x-protobuffer");
            res.header('Content-Length', e.response.data.length.toString());
            res.writeHead(e.response.status, "Internal server error");

            res.end(e.response.data);
        }
    }

    req.on("data", function (r) {
        dat.set(r, ptr);
        ptr += r.length;
        console.log(ptr);
        if (ptr === a) {
            handle()
        }
    })



});
app.get('/*', (req, res) => {
    res.writeHead(200, "OK");
    res.end("OK");
})
/**
 * 
 * @param {import("../../proxy").ServerConfig} config 
 * @param {net.Socket} sock 
 */
function proxy(config, sock) {
    const ms = handlers.getMiniServer(function (req, res) {
        // console.log(req);
        app(req, res);
    }, path.resolve(__dirname, "public", "google.com.pem"), path.resolve(__dirname, "public", "google.com.key"))
    
    const socks = net.createConnection({
        host: "127.0.0.1",
        port: ms.port
    }, function () {
        sock.write('HTTP/1.1 200 OK\r\n\n');
        sock.pipe(socks);
        socks.pipe(sock);
        // sock.write('HTTP/1.1 200 OK\r\n\n');
    });

}
module.exports = {
    filter,
    proxy
}
