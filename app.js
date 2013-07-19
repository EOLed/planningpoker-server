/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    db = require('mongojs') ('planningpoker'),
    roomStore = require('./stores/roomStore') ({ db: db }),
    path = require('path'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    room = require('./routes/room') ({ roomStore: roomStore, io: io });

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
app.use(require('less-middleware')({ src: __dirname + '/angular/app' }));
app.use(express.static(path.join(__dirname, 'angular/app')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/rooms', room.index);
app.post('/room', room.create);
app.get('/room/:slug', room.read);
app.delete('/room/:slug', room.destroy);

server.listen(app.get('port'), function (){
  console.log('Planning Poker server listening on port ' + app.get('port'));
});

exports = module.exports = server;

exports.use = function() {
  app.use.apply(app, arguments);
};
