/*jslint node: true*/
/*global spyOn: false, describe: false, beforeEach: false, afterEach: false, inject: false, it: false, expect: false*/
'use strict';

describe('Route: room', function () {
  var roomStore = require('../../../stores/roomStore') ({ db: { collection: function () {} } }),
      sinon = require('sinon'),
      host = { id: 'hostUserId', username: 'achan', name: 'Amos Chan' },
      room,
      _req_,
      _res_,
      socket,
      mockBroadcast,
      currentRoom;

  beforeEach(function () {
    currentRoom = { slug: 'dummyslug', key: '<roomKey>', host: host };
    room = require('../../../routes/room')({ roomStore: roomStore });
    _req_ = { param: function () {} };
    _res_ = { json: function () {}, send: function () {} };
    socket = { on: function () {}, broadcast: { emit: function () {} } };
    mockBroadcast = sinon.mock(socket.broadcast);
    room.setSocket(socket);
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
      expect(createStub.getCall(0).args[0].key).toBeDefined();
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

      it('should start listening for room-specific messages', function () {
        var mockSocket= sinon.mock(socket);
        mockSocket.expects('on').withArgs('message <roomKey>');
        room.create(_req_, _res_);
        mockSocket.verify();
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

  describe('on socket message "message <roomKey>"', function () {
    var paramsStub, mockResponse, createStub, socketStub;

    beforeEach(function () {
      paramsStub = sinon.stub(_req_, 'param')
                        .withArgs('slug').returns('dummyslug')
                        .withArgs('host').returns(host);
      mockResponse = sinon.mock(_res_);
      createStub = sinon.stub(roomStore, 'create');
      createStub.yieldsTo('onsuccess', currentRoom);
      socketStub = sinon.stub(socket, 'on');
      room.create(_req_, _res_);
    });

    afterEach(function () {
      roomStore.create.restore();
    });

    it('should re-broadcast all messages to room', function () {
      var payload = { whatever: 'data' };

      mockBroadcast.expects('emit').withArgs('message <roomKey>', payload);
      socketStub.yield(payload);
      mockBroadcast.verify();
    });

    describe('with type "commit"', function () {
      var payload;
      beforeEach(function () {
        payload = { user: host, room: currentRoom, value: 40, type: 'commit' };
      });

      it('should update the current user with the status "committed"', function () {
        var mockCommit = sinon.mock(roomStore)
                              .expects('setStatusForUser')
                              .withArgs(host, currentRoom, 'committed', 40);
        socketStub.yield(payload);
        mockCommit.verify();
      });
    });
  });

  describe('join', function () {
    var paramsStub, mockResponse, addUserToRoomStub;

    beforeEach(function () {
      paramsStub = sinon.stub(_req_, 'param')
                        .withArgs('slug').returns('dummyslug')
                        .withArgs('user').returns(host);
      mockResponse = sinon.mock(_res_);
      addUserToRoomStub = sinon.stub(roomStore, 'addUserToRoom');
    });

    it('should broadcast user join event to room', function () {
      mockBroadcast.expects('emit')
                   .withArgs('message <roomKey>', { user: host, room: currentRoom, type: 'join' });

      addUserToRoomStub.yieldsTo('onsuccess', currentRoom);
      mockResponse.expects('json').withArgs(currentRoom);
      room.join(_req_, _res_);
      mockResponse.verify();
      mockBroadcast.verify();
    });

    it('should return json of the room returned from store', function () {
      addUserToRoomStub.yieldsTo('onsuccess', currentRoom);
      mockResponse.expects('json').withArgs(currentRoom);
      room.join(_req_, _res_);
      mockResponse.verify();
    });

    it('should return 500 error code on failure', function () {
      addUserToRoomStub.yieldsTo('onfailure');
      mockResponse.expects('send').withArgs(sinon.match.any, 500);
      room.join(_req_, _res_);
      mockResponse.verify();
    });

    afterEach(function () {
      roomStore.addUserToRoom.restore();
    });
  });
});
