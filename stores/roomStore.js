module.exports = function (options) {
  var rooms = options.db.collection('rooms');

  rooms.remove();

  var find = function (criteria, options) {
    rooms.find(criteria, function(err, rooms) {
      doCallback(options, err, rooms);
    });
  };

  var doCallback = function(options, err, value) {
    if (err) {
      if (options.onfailure) {
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
          status = options.status;

      rooms.findAndModify({ query: { slug: room.slug, users: { $elemMatch: { id: user.id } } },
                            update: { $set: { 'users.$.status': status } },
                            new: true },
                          function (err, room) {
                            doCallback(options, err, room);
                          });
    },

    clearUserStatusesForRoom: function (options) {
      var room = options.room;
      var users = options.room.users;
      
      for (var i = 0; i < users.length; i++) {
        var currentUser = users[i];
        currentUser.status = { type: 'active' };
      }


      rooms.findAndModify({ query: { slug: room.slug },
                            update: { $set: { users: users } },
                            new: true },
                          function (err, room) {
                            doCallback(options, err, room);
                          });
    },

    addUserToRoom: function(user, slug, options) {
      rooms.find({ slug: slug, users: { $elemMatch: { id: user.id } } }, function (err, matches) {
        if (matches.length === 0) {
          rooms.findAndModify({ query: { slug: slug },
                                update: { $addToSet: { users: user } },
                                new: true },
                              function (err, room) {
                                doCallback(options, err, room);
                              });
        } else {
          doCallback(options, err, matches[0]);
        }
      });
    },

    destroy: function (slug) {
      rooms.remove({ slug: slug }, true);
    }
  };
};
