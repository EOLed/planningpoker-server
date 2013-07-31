module.exports = function (options) {
  var rooms = options.db.collection('rooms');

  rooms.ensureIndex( { "lastUpdated": 1 }, { expireAfterSeconds: 5 * 60 * 60 } );

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

  var prolongRoomLife = function (slug) {
    rooms.findAndModify({ query: { slug: slug },
                          update: { $set: { lastUpdated: new Date() } },
                          new: true });
  };

  return {
    create: function (room, options) {
      room.key = Math.random().toString(36).substring(7);

      rooms.save(room, function(err, room) {
        doCallback(options, err, room);
      });

      prolongRoomLife(room.slug);
      return room;
    },

    findBySlug: function (slug, options) {
      find({ slug: slug }, options);
    },

    findAll: function (options) {
      find({}, options);
    },

    setUsernameForUser: function(options) {
      var user = options.user, room = options.room;

      rooms.findAndModify({ query: { slug: room.slug, users: { $elemMatch: { id: user.id } } },
                            update: { $set: { 'users.$.username': user.username } },
                            new: true },
                          function (err, room) {
                            doCallback(options, err, room);
                          });

      prolongRoomLife(room.slug);
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

      prolongRoomLife(room.slug);
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

      prolongRoomLife(room.slug);
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


      prolongRoomLife(slug);
    },

    destroy: function (slug) {
      rooms.remove({ slug: slug }, true);
    }
  };
};
