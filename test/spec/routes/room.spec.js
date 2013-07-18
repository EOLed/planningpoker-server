/*jslint node: true*/
/*global spyOn: false, describe: false, beforeEach: false, afterEach: false, inject: false, it: false, expect: false*/
'use strict';

describe('Route: room', function () {
  var roomStore = require('../../../stores/roomStore') ({ db: { collection: function () { return { remove: function () {} }; } } }),
      sinon = require('sinon'),
      host = { id: 'hostUserId', username: 'achan', name: 'Amos Chan' },
      room,
      _req_,
      _res_,
      mockBroadcast,
      currentRoom,
      io,
      socketsStub;

  beforeEach(function () {
    io = { sockets: { on: function () {}, broadcast: { emit: function () {} } } };
    currentRoom = { slug: 'dummyslug', host: host };
    socketsStub = sinon.stub(io.sockets, 'on');
    room = require('../../../routes/room')({ roomStore: roomStore, io: io });
    _req_ = { param: function () {} };
    _res_ = { json: function () {}, send: function () {} };
    mockBroadcast = sinon.mock(io.sockets.broadcast);
  });

  afterEach(function () {
  });

  describe('create', function () {
    var paramsStub, mockResponse, createStub;

    beforeEach(function () {
      paramsStub = sinon.stub(_req_, 'param')
                        .withArgs('slug').returns('dummyslug')
                        .withArgs('host').returns(host);
      mockResponse = sinon.mock(_res_);
      createStub = sinon.stub(roomStore, 'create');
    });

    afterEach(function () {
      roomStore.create.restore();
    });

    it('should create a new room with values from params', function () {
      room.create(_req_, _res_);
      expect(createStub.getCall(0).args[0].slug).toEqual('dummyslug');
      expect(createStub.getCall(0).args[0].host).toEqual(host);
    });

    describe('onsuccess', function () {
      beforeEach(function () {
        createStub.yieldsTo('onsuccess', currentRoom);
      });

      it('should return json of the room that was just created', function () {
        mockResponse.expects('json').withArgs(currentRoom);
        room.create(_req_, _res_);
        mockResponse.verify();
      });
    });

    describe('onfailure', function () {
      it('should return 500 error code on failure', function () {
        createStub.yieldsTo('onfailure');
        mockResponse.expects('send').withArgs(sinon.match.any, 500);
        room.create(_req_, _res_);
        mockResponse.verify();
      });
    });
  });

  describe('on socket message "message"', function () {
    var paramsStub, mockResponse, createStub, socket;

    beforeEach(function () {
      socket = { on: function () {}, emit: function () {}, broadcast: { emit: function () {} } };
    });

    afterEach(function () {
    });

    it('should re-broadcast all messages to room', function () {
    });

    describe('with type "join"', function () {
      var payload, socketStub, addUserStub;
      beforeEach(function () {
        payload = { type: 'join', slug: 'dummyslug', user: host };
        spyOn(roomStore, 'addUserToRoom');
        spyOn(socket.broadcast, 'emit');
        spyOn(socket, 'emit');
        socketStub = sinon.stub(socket, 'on');
        addUserStub = sinon.stub(roomStore, 'addUserToRoom');
        socketsStub.yield(socket);
        socketStub.yield(payload);
      });

      it('should add current user to room', function () {
        expect(roomStore.addUserToRoom.getCall(0).args[0]).toEqual(host);
        expect(roomStore.addUserToRoom.getCall(0).args[1]).toEqual('dummyslug');
      });

      it('should broadcast a join event', function () {
        addUserStub.yieldTo('onsuccess', { slug: 'whatijustpassed' });
        expect(socket.broadcast.emit).toHaveBeenCalledWith('message',
                                                           { type: 'join',
                                                             user: host,
                                                             slug: 'whatijustpassed',
                                                             room: { slug: 'whatijustpassed' } });
      });

      it('should emit a join accepted event back to user', function () {
        addUserStub.yieldTo('onsuccess', { slug: 'whatijustpassed' });
        expect(socket.emit).toHaveBeenCalledWith('message',
                                                 { type: 'joinAccepted',
                                                   user: host,
                                                   slug: 'whatijustpassed',
                                                   room: { slug: 'whatijustpassed' } });
      });
    });

    describe('with type "commit"', function () {
      var payload, socketStub, setStatusStub;
      beforeEach(function () {
        payload = { type: 'commit', room: { slug: 'myroom' }, user: host, value: '1' };
        spyOn(roomStore, 'setStatusForUser');
        spyOn(socket.broadcast, 'emit');
        spyOn(socket, 'emit');
        socketStub = sinon.stub(socket, 'on');
        setStatusStub = sinon.stub(roomStore, 'setStatusForUser');
        socketsStub.yield(socket);
        socketStub.yield(payload);
      });

      it('should update the current user with the status "committed"', function () {
        var options = roomStore.setStatusForUser.getCall(0).args[0];
        expect(options.user).toEqual(host);
        expect(options.room).toEqual({ slug: 'myroom' });
        expect(options.status).toEqual({ type: 'committed', value: '1' });
      });

      it('should broadcast a commit event', function () {
        setStatusStub.yieldTo('onsuccess', { slug: 'whatijustpassed' });
        expect(socket.broadcast.emit).toHaveBeenCalledWith('message',
                                                           { type: 'commit',
                                                             slug: 'whatijustpassed',
                                                             room: { slug: 'whatijustpassed' } });
      });
    });
  });
});
