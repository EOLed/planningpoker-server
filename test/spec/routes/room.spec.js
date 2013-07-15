/*jslint node: true*/
/*global spyOn: false, describe: false, beforeEach: false, afterEach: false, inject: false, it: false, expect: false*/
'use strict';

var _roomStore_ = require('../../../stores/roomStore'),
    sinon = require('sinon');

describe('Route: room', function () {
  var roomStore, room, _req_, _res_;

  beforeEach(function () {
    roomStore = sinon.mock(_roomStore_);
    room = require('../../../routes/room')({ roomStore: _roomStore_ });
    _req_ = {};
    _res_ = {};
  });

  afterEach(function () {
    roomStore.restore();
  });

  describe('create', function () {
    beforeEach(function () {
      _req_.param = function () {};
      _res_.json = function () {};
    });

    it('should create a new room with values from params', function () {
      var host = { id: 'hostUserId', username: 'achan', name: 'Amos Chan' };
      var paramsStub = sinon.stub(_req_, 'param')
                            .withArgs('slug').returns('dummyslug')
                            .withArgs('host').returns(host);

      roomStore.expects('create').withArgs({ slug: 'dummyslug', host: host });
      room.create(_req_, _res_);
      roomStore.verify();
      paramsStub.reset();
    });
  });
});
