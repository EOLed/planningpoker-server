module.exports = (function () {
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
      room.key = Math.random().toString(36).substring(7);
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
