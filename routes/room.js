module.exports = function (options) {
  var socket;
  var store = options.roomStore;
  var io = options.io;

  var broadcastUserJoinEvent = function (room, user) {
    var message = { user: user, room: room, type: 'join' };
    io.sockets.broadcast.emit('message', message);
  };

  var commit = function (user, room, value) {
    store.setStatusForUser(user, room, 'committed', value);
  };

  var join = function (options) {
    var user = options.user;
    var slug = options.slug;
    var socket = options.socket;

    if (typeof user === 'string') {
      user = JSON.parse(user);
    }

    console.log('user ' + user.id + ' joining room ' + slug);

    var onfailure = function (err) {
    };

    var onsuccess = function(room) {
      console.log('join success');
      socket.broadcast.emit('message', { type: 'join', slug: room.slug, user: user, room: room });
      socket.emit('message', { type: 'joinAccepted', slug: room.slug, user: user, room: room });
    };

    console.log('adding user to room');
    var room = store.addUserToRoom(user, slug, { onsuccess: onsuccess, onfailure: onfailure });
  };

  io.sockets.on('connection', function (socket) {
    console.log('client has connected...');
    socket.on('message', function (data) {
      console.log('message recieved: ' + JSON.stringify(data));

      if (data.type === 'commit') {
        commit(data.user, data.room, data.value);
      } else if (data.type === 'join') {
        join({ slug: data.slug, user: data.user, socket: socket });
      }
    });
  });

  return {
    create: function (req, res) {
      var slug = req.param('slug');
      var host = req.param('host');

      var onsuccess = function (room) {
        return res.json(room);
      };

      var onfailure = function(err) {
        return res.send(err, 500);
      };

      var key = Math.random().toString(36).substring(7);

      store.create({ slug: slug, key: key, host: host },
                   { onsuccess: onsuccess, onfailure: onfailure });
    },

    read: function (req, res) {
      var slug = req.param('slug');
      res.json(store.findBySlug(slug));
    },

    destroy: function (req, res) {
      var slug = req.param('slug');
      res.json(store.destroy(slug));
    },

    index: function (req, res) {
      var options = {
        onsuccess: function (rooms) {
          res.json(rooms, 200);
        },

        onfailure: function (err) {
          res.send(err, 500);
        }
      };
      store.findAll(options);
    },


    setSocket: function (sock) {
      console.log('setting socket...');
      socket = sock;
    }
  };
};
