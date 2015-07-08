
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');


//relatorios old
var v1 = require('./routes/v1');
//relatorios new
var v2 = require('./routes/v2');
var api = require('./routes/api');


var http = require('http');
var path = require('path');

var app = express();
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//app.use(require('./lib/appengine-handlers'));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/kmrodado', v2.kmrodado);
app.get('/api/bigquery', api.bigquery);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
