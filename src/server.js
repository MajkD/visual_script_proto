var express = require('express');
var app = express();
var port = 8082;

app.use('/', express.static(__dirname + '/page'));

app.listen(port, function () {
  console.log("Listening on port: ", port);
});