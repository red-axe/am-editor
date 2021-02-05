const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const Client = require('./client');

startServer();

function startServer() {
  // Create a web server to serve files and listen to WebSocket connections
  const app = express();

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(
    bodyParser.urlencoded({
      extended: false,
    }),
  );

  const server = http.createServer(app);

  var wss = new WebSocket.Server({ server });
  const client = new Client();
  let id = 1;
  wss.on('connection', function(ws, request) {
    //用户连接到 socket，此处应根据request获取到相关参数，并且处理用户token，传递到api，效验数据合法性
    //此处为模拟演示数据
    client.add(ws, 'demo', {
      id,
      name: `用户${id}`,
    });
    id++;
  });

  server.listen(8080);
  console.log('OT Server Listening on http://localhost:8080');
}
