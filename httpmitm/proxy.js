const fs = require('fs')
const express = require('express');
const https = require('https');
const path = require('path');
const net = require('net');
const server = net.createServer();
// miniServerMap[host] = new MiniServer();
/**
 * @type {Object<string,MiniServer>}
 */
var miniServerMap = {};

// manifest.json is per website
// Location: configs/<website name>/manifest.json (ex. www.google.com/manifest.json)


/**
 * @type {import('./proxy').ServerConfig}
 */
let a;

/**
 * @type {Object<string, {
 *  filter: (f: import('./proxy').FilterInfo)=>void,
 *  proxy: (config: import('./proxy').ServerConfig, clientsock: net.Socket)=>void,
 *  config: import('./proxy').ServerConfig
 * }>}
 */
let serverCallbackMap = {};



/**
 * 
 * @param {import('./proxy').ServerConfig} config 
 */
function readServerConfig(address, config) {
  /**
   * 
   * @returns {import('./proxy').FilterFunction}
   */
  const defaultServerFilterGetter = function () {
    if (config.filterPath) { // Filter path takes precedence as it handles all cases
      return require(filterPath).filter;
    }
    else if (config.filters) {
      
      return function ({tls}) {
        if (tls) {
          return config.filters.includes('https');
        }
        else {
          return config.filters.includes('http');
        }
      }
    }
  }
  const defaultServerProxyGetter = function () {
    if (config.proxyPath) { // Proxypath takes precedence over rev proxy due to js handling nature
      return require(path.resolve(__dirname,"configs", address, config.proxyPath)).proxy;
    }else if (config.reverseProxyUrl) {
      const url = config.reverseProxyUrl;
      const a = url + req.path;
      const x = new URL(a);
      const socketDNS = x.host;


      /**
       * @param {net.Socket} clientsock
       */
      return function (config, clientsock) {
        const as = net.createConnection({
          host: x.host,
          port: parseInt(x.port)
        });
        clientsock.pipe(as);
        
      }
    }
    
  }

  const configData = {filter: defaultServerFilterGetter, proxy: defaultServerProxyGetter, config};
  return configData;
}
function getAllServerConfigs() {
  const allConfigDir = path.resolve(__dirname, 'configs');
  const a = fs.readdirSync(allConfigDir);
  for (const server of a){
    console.info("Reading config for: ", server);
    var serverPath = null;
    const files = fs.readdirSync((serverPath = path.resolve(allConfigDir, server)));
    if (!files.includes("manifest.json")) {
      console.error(`Could not read config for ${server}. Moving on to next server`);
      continue;
    }
    const manifestData = fs.readFileSync(path.resolve(serverPath, 'manifest.json'), {encoding: 'utf8'});
    console.log(manifestData)
    /**
     * @type {import('./proxy').ServerConfig}
     */
    const serverConfig = JSON.parse(manifestData);
    const funcs = readServerConfig(server,serverConfig);
    serverCallbackMap[serverConfig.matches ?? server] = funcs;
  }
}
getAllServerConfigs()
// FilterInfo: {
//     host: string,
//     tls: boolean,
//}
server.on('connection', (clientToProxySocket) => {
    // We need only the data once, the starting packet
    // console.log("client connected");
    clientToProxySocket.once('data', (data) => {
      let isTLSConnection = data.toString().indexOf('CONNECT') !== -1;
      var path = null;
      //Considering Port as 80 by default 
      let serverPort = 80;
      let serverAddress;
      var useMiniServer= false;
      if (isTLSConnection) {
        // Port changed to 443, parsing the host from CONNECT 
        serverPort = 443;
        serverAddress = data.toString()
                            .split('CONNECT ')[1]
                            .split(' ')[0].split(':')[0];
        // console.log(serverAddress);
        
      } else {
         // Parsing HOST from HTTP
         serverAddress = data.toString()
                             .split('Host: ')[1].split('\r\n')[0];
         const firstLine = data.toString().split('\r\n')[0];
         path = firstLine.split(' ')[1];
        //  console.log(serverAddress);
      }
      console.log(serverAddress);
      console.log(isTLSConnection);
      var isFiltered = false;
      var using = null;
      Object.keys(serverCallbackMap).forEach((v)=>{
        // console.log("Proxy is: "+ v);
        // console.log(new RegExp(v).test(serverAddress));
        if (new RegExp(v).test(serverAddress)) {
          // It matches. We should run the handler.
          using = v;
          isFiltered = serverCallbackMap[v].filter({
            tls: isTLSConnection,
            host: serverAddress,
            path: path
          });
          // console.log(isFiltered);
        }
      })
      console.log(isFiltered);
      if (isFiltered) {
        serverCallbackMap[using].proxy()(serverCallbackMap[using].config, clientToProxySocket);
        return;
      }
      let proxyToServerSocket = net.createConnection({
        host: serverAddress,
        port: serverPort
      }, () => {
        // console.log('PROXY TO SERVER SET UP');
        if (isTLSConnection) {
          //Send Back OK to HTTPS CONNECT Request
          clientToProxySocket.write('HTTP/1.1 200 OK\r\n\n');
        } else {
          proxyToServerSocket.write(data);
        }
        
        // Piping the sockets
        clientToProxySocket.pipe(proxyToServerSocket);
        proxyToServerSocket.pipe(clientToProxySocket);
        
        proxyToServerSocket.on('error', (err) => {
          // console.log('PROXY TO SERVER may have disconnected.');
          // console.log(err);
        });
      });
      proxyToServerSocket.on('error', (e)=>{
        console.log(e);
      })
      clientToProxySocket.on('error', err => {
        console.log('CLIENT TO PROXY may have disconnected.');
      });
    });
  });
server.on('error', (err) => {
  console.log('SERVER ERROR');
  console.log(err);
});
server.on('close', () => {
  console.log('Client Disconnected');
});
server.listen(8126, () => {
  console.log('Server running at http://localhost:' + 8126);
});
//Source code below is for creating a mini server or a server that serves requests within memory.(or not)
