module.exports = function (options) {
  var socket;
  var store = options.roomStore;

  var broadcastUserJoinEvent = function (room, user) {
    var eventName = 'message ' + room.key;
    var message = { user: user, room: room, type: 'join' };
    socket.broadcast.emit(eventName, message);
  };

  var commit = function (user, room, value) {
    store.setStatusForUser(user, room, 'committed', value);
  };

  return {
    create: function (req, res) {
      var slug = req.param('slug');
      var host = req.param('host');

      var onsuccess = function (room) {
        var messageKey = 'message ' + room.key;
        console.log('listening for "' + messageKey + '" messages...');
        socket.on(messageKey, function (data) {
          console.log('message received.... ' + JSON.stringify(data));
          if (data.type === 'commit') {
            commit(data.user, data.room, data.value);
          }
          socket.broadcast.emit(messageKey, data);
        });

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

    join: function (req, res) {
      var slug = req.param('slug'),
          user = req.param('user');

      if (typeof user === 'string') {
        user = JSON.parse(user);
      }

      console.log('user ' + user.id + ' joining room ' + slug);

      var onfailure = function (err) {
        res.send(err, 500);
      };

      var onsuccess = function(room) {
        broadcastUserJoinEvent(room, user);
        res.json(room, 200);
      };

      var room = store.addUserToRoom(user, slug, { onsuccess: onsuccess, onfailure: onfailure });
    },

    setSocket: function (sock) {
      console.log('setting socket...');
      socket = sock;
    }
  };
};
