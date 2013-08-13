var express = require('express');
var request = require('request');
var app = express();

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(__dirname + '/'));


// proxy calls
app.get('/Model3PG.js', function(req, res){
	request('https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/Model3PG.js', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		  res.send(body);
	  } else {
		  res.send("error");
	  }
	});
});

app.get('/SingleRunFunctions.js', function(req, res){
	request('https://raw.github.com/CSTARS/AHB-PNW/master/models/3pg/js/SingleRunFunctions.js', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		  res.send(body);
	  } else {
		  res.send("error");
	  }
	});
});



app.listen(3001);
console.log("3PG Model server up at http://localhost:3001");

