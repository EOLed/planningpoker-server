module.exports = function (options) {
  var _socket;
  var _store = options.roomStore;

  var _broadcastUserJoinEvent = function (room, user) {
    var eventName = 'message ' + room.key;
    var message = { user: user, room: room, type: 'join' };
    _socket.broadcast.emit(eventName, message);
  };

  return {
    create: function (req, res) {
      var slug = req.param('slug');
      var host = req.param('host');

      var onsuccess = function (room) {
        console.log('listening for "message ' +  room.key + '" messages...');
        _socket.on('message ' + room.key, function (data) {
          console.log('message received.... ' + JSON.stringify(data));
          if (data.type === 'commit') {
            commit(data.user, data.room, data.value);
          }
          _socket.broadcast.emit('message ' + room.key, data);
        });

        return res.json(room);
      };

      var onfailure = function(err) {
        return res.send(err, 500);
      };

      _store.create({ slug: slug, host: host }, { onsuccess: onsuccess, onfailure: onfailure });
    },

    commit: function (user, room, value) {
      _store.setStatusForUser(user, room, 'committed', value);
    },

    read: function (req, res) {
      var slug = req.param('slug');
      res.json(_store.findBySlug(slug));
    },

    destroy: function (req, res) {
      var slug = req.param('slug');
      res.json(_store.destroy(slug));
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
      _store.findAll(options);
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
        _broadcastUserJoinEvent(room, user);
        res.json(room, 200);
      };

      var room = _store.addUserToRoom(user, slug, { onsuccess: onsuccess, onfailure: onfailure });
    },

    setSocket: function (socket) {
      _socket = socket;
    }
  };
};
