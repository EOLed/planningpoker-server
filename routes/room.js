module.exports = (function () {
  console.log('reconstruct room controller');
  var _store = (function () {
    var _backend = [];

    var _deleteBySlug = function (slug) {
      for (var i = 0; i < _backend.length; i++) {
        if (_backend[i].slug === slug) {
          _backend.splice(i, 1);
          return;
        }
      }
    };

    return {
      create: function (room) {
        _backend.push(room);
      },

      findBySlug: function (slug) {
        for (var i = 0; i < _backend.length; i++) {
          if (_backend[i].slug == slug) {
            return _backend[i];
          }
        }

        return {};
      },

      findAll: function () {
        return _backend;
      },

      update: function (room) {
        _deleteBySlug(room.slug);
        _backend.push(room);
      },

      destroy: function (slug) {
        _deleteBySlug(slug);
      }
    };
  }) ();

  var _addOrReplaceUser = function (users, user) {
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === user.id) {
        users.splice(i, 1);
        break;
      }
    }

    users.push(user);
    return users;
  };

  return {
    create: function (req, res) {
      var slug = req.param('slug');
      _store.create({ slug: slug });
      return res.json(_store.findBySlug(slug));
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
      res.json(_store.findAll(), 200);
    },

    join: function (req, res) {
      var slug = req.param('slug'),
          user = req.param('user'),
          ioRoom = 'pp:' + slug;

      if (typeof user === 'string') {
        user = JSON.parse(user);
      }

      console.log('user ' + user.id + ' joining room ' + slug);

      var room = _store.findBySlug(slug);
      room.users = _addOrReplaceUser(room.users || [], user);
      _store.update(room);

      return res.json(room, 200);
    }
  };
} ());
