/**
 * Created by MLS on 15/6/14.
 */
var http = require('http'),
  fs = require('fs'),
  path = require('path'),
  mime = require('mime'),
  cache = {};
function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: reaource not found.');
  response.end();
}
function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {"Content-Type": mime.lookup(path.basename(filePath))});
  response.end(fileContents);
}
function serveStatic(response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    console.log(absPath);
    fs.exists(absPath, function(exists){
      if (exists) {
        fs.readFile(absPath, function(err, data){
          if (err) {
            console.log(err);
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}
var server = http.createServer(function(request, response){
  var filePath = false;

  if (request.url == "/") {
    filePath = 'public/index.html';
  } else if (request.url.indexOf("socket.io.js") >= 0) {
    filePath = 'node_modules' + request.url;
  } else {
    filePath = 'public' + request.url;
  }


  var absPath = '../' + filePath;
  serveStatic(response, cache, absPath);
});
server.listen(3000, function(){
  console.log("server listening on port 3000.");
});
var chatServer = require('../lib/chat_server');
chatServer.listen(server);