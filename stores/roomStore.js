module.exports = function (options) {
  var rooms = options.db.collection('rooms');

  var find = function (criteria, options) {
    rooms.find(criteria, function(err, rooms) {
      doCallback(options, err, rooms);
    });
  };

  var doCallback = function(options, err, value) {
    if (err) {
      if (typeof options.onfailure === 'undefined') {
        return options.onfailure(err);
      }
    } else if (options.onsuccess) {
      return options.onsuccess(value);
    }
  };

  return {
    create: function (room, options) {
      room.key = Math.random().toString(36).substring(7);
      rooms.save(room, function(err, room) {
        doCallback(options, err, room);
      });
      return room;
    },

    findBySlug: function (slug, options) {
      find({ slug: slug }, options);
    },

    findAll: function (options) {
      find({}, options);
    },

    setStatusForUser: function(options) {
      var user = options.user,
          room = options.room,
          status = options.status,
          value = options.value;

      rooms.findAndModify({ query: { slug: room.slug, users: { $elemMatch: { id: user.id } } },
                            update: { $addToSet: { 'users.$.status': status,
                                                   'users.$.value': value } },
                            new: true },
                          function (err, room) {
                            doCallback(options, err, room);
                          });
    },

    addUserToRoom: function(user, slug, options) {
      rooms.findAndModify({ query: { slug: slug },
                            update: { $addToSet: { users: user } },
                            new: true },
                          function (err, room) {
                            doCallback(options, err, room);
                          });
    },

    destroy: function (slug) {
      rooms.remove({ slug: slug }, true);
    }
  };
};
