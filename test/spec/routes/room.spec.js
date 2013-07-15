/*jslint node: true*/
/*global spyOn: false, describe: false, beforeEach: false, afterEach: false, inject: false, it: false, expect: false*/
'use strict';

var roomStore = require('../../../stores/roomStore'),
    sinon = require('sinon'),
    host = { id: 'hostUserId', username: 'achan', name: 'Amos Chan' };

describe('Route: room', function () {
  var mockRoomStore, room, _req_, _res_;

  beforeEach(function () {
    mockRoomStore = sinon.mock(roomStore);
    room = require('../../../routes/room')({ roomStore: roomStore });
    _req_ = { param: function () {} };
    _res_ = { json: function () {} };
  });

  afterEach(function () {
    mockRoomStore.restore();
  });

  describe('create', function () {
    var paramsStub;
    var mockResponse;

    beforeEach(function () {
      paramsStub = sinon.stub(_req_, 'param')
                        .withArgs('slug').returns('dummyslug')
                        .withArgs('host').returns(host);
      mockResponse = sinon.mock(_res_);
      mockRoomStore.expects('create')
                   .withArgs({ slug: 'dummyslug', host: host })
                   .returns({ slug: 'dummyslug', host: host });
    });

    afterEach(function () {
      paramsStub.reset();
      mockRoomStore.restore();
    });

    it('should create a new room with values from params', function () {
      room.create(_req_, _res_);
      mockRoomStore.verify();
    });

    it('should return json of the room that was just created', function () {
      mockResponse.expects('json').withArgs({ slug: 'dummyslug', host: host });
      room.create(_req_, _res_);
      mockResponse.verify();
    });
  });
});
