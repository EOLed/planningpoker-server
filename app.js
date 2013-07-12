/*jslint es5: true*/
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    room = require('./routes/room'),
    http = require('http'),
    path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/client/app' }));
app.use(express.static(path.join(__dirname, 'client/app')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/rooms', room.index);
app.post('/room', room.create);
app.get('/room/:slug', room.read);
app.delete('/room/:slug', room.destroy);
app.put('/room/join/:slug', room.join);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Planning Poker server listening on port ' + app.get('port'));
});
