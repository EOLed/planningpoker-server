module.exports = function (options) {
  var socket;
  var store = options.roomStore;
  var io = options.io;

  var broadcastUserJoinEvent = function (room, user) {
    var message = { user: user, room: room, type: 'join' };
    io.sockets.broadcast.emit('message', message);
  };

  var commit = function (options) {
    var user = options.user;
    var room = options.room;
    var value = options.value;
    var socket = options.socket;
    options.status = { type: 'committed', value: value };

    options.onsuccess = function (room) {
      socket.broadcast.emit('message', { type: 'commit', slug: room.slug, room: room });
    };

    options.onfailure = function (err) {
      console.error('err: ' + err);
    };

    store.setStatusForUser(options);
  };

  var join = function (options) {
    var user = options.user;
    var slug = options.slug;
    var socket = options.socket;

    if (typeof user === 'string') {
      user = JSON.parse(user);
    }

    var onfailure = function (err) {
      console.error('err: ' + err);
    };

    var onsuccess = function(room) {
      socket.broadcast.emit('message', { type: 'join', slug: room.slug, user: user, room: room });
      socket.emit('message', { type: 'joinAccepted', slug: room.slug, user: user, room: room });
    };

    var room = store.addUserToRoom(user, slug, { onsuccess: onsuccess, onfailure: onfailure });
  };

  io.sockets.on('connection', function (socket) {
    socket.on('message', function (data) {
      if (data.type === 'commit') {
        commit({ user: data.user, room: data.room, value: data.value, socket: socket });
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

      store.create({ slug: slug, host: host }, { onsuccess: onsuccess, onfailure: onfailure });
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
    }
  };
};
