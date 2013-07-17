/*jslint node: true*/
/*global spyOn: false, describe: false, beforeEach: false, afterEach: false, inject: false, it: false, expect: false*/
'use strict';

var roomStore = require('../../../stores/roomStore') ({ db: { collection: function () {} } }),
    sinon = require('sinon'),
    host = { id: 'hostUserId', username: 'achan', name: 'Amos Chan' };

describe('Route: room', function () {
  var room, _req_, _res_;

  beforeEach(function () {
    room = require('../../../routes/room')({ roomStore: roomStore });
    _req_ = { param: function () {} };
    _res_ = { json: function () {}, send: function () {} };
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
      expect(createStub.calledWith({ slug: 'dummyslug', host: host })).toBeTruthy();
    });

    it('should return json of the room that was just created on success', function () {
      createStub.yieldsTo('onsuccess', { slug: 'dummyslug', host: host });
      mockResponse.expects('json').withArgs({ slug: 'dummyslug', host: host });
      room.create(_req_, _res_);
      mockResponse.verify();
    });

    it('should return 500 error code on failure', function () {
      createStub.yieldsTo('onfailure');
      mockResponse.expects('send').withArgs(sinon.match.any, 500);
      room.create(_req_, _res_);
      mockResponse.verify();
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
      var socket = { broadcast: { emit: function () {} } };
      var mockBroadcast = sinon.mock(socket.broadcast);
      room.setSocket(socket);
      mockBroadcast.expects('emit');

      addUserToRoomStub.yieldsTo('onsuccess', { slug: 'dummyslug', host: host });
      mockResponse.expects('json').withArgs({ slug: 'dummyslug', host: host });
      room.join(_req_, _res_);
      mockResponse.verify();
    });

    it('should return json of the room returned from store', function () {
      var socket = { broadcast: { emit: function () {} } };
      room.setSocket(socket);
      addUserToRoomStub.yieldsTo('onsuccess', { slug: 'dummyslug', host: host });
      mockResponse.expects('json').withArgs({ slug: 'dummyslug', host: host });
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
