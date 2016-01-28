var inherits = require('inherits')
var events = require('events')
var stream = require('stream')
var debug = require('debug')('swarmhub')
var assert = require('assert')

var MESSAGE_TYPE_SWARMHUB = 1
var MESSAGE_TYPE_DATA = 2

function DataPeer (backingPeer) {
  events.EventEmitter(this)
  this.backingPeer = backingPeer
}
inherits(DataPeer, events.EventEmitter)

DataPeer.prototype.write = function (data) {
  debug('writing', data)
  assert(Buffer.isBuffer(data))
  this.backingPeer.write(Buffer([MESSAGE_TYPE_DATA]) + data)
}

function SwarmHub (backingSwarm) {
  if (!(this instanceof SwarmHub)) return new SwarmHub(backingSwarm)

  var self = this
  events.EventEmitter(self)

  self.backingSwarm = backingSwarm
  self.peers = []
  self.subscribers = {}
  self.dataSwarm = new events.EventEmitter()

  backingSwarm.on('peer', function (peer, id) {
    debug('new peer', id)
    self.peers.push(peer)

    var dataPeer = new DataPeer(peer)
    self.dataSwarm.emit('peer', dataPeer, id)

    peer.on('data', function (message) {
      var messageType = message[0]
      var messageRest = message.slice(1)
      if (messageType === MESSAGE_TYPE_SWARMHUB) {
        debug('received broadcast', messageRest.toString())
        var messageObj = JSON.parse(messageRest)
        var subscribers = self.subscribers[ messageObj.channel ] || []
        for (var s in subscribers) {
          subscribers[s].write(messageObj.data)
        }
      } else if (messageType === MESSAGE_TYPE_DATA) {
        debug('received data', messageRest.toString())
        dataPeer.emit('data', messageRest)
      } else {
        assert.fail(messageType)
      }
    })
  })
}
inherits(SwarmHub, events.EventEmitter)

SwarmHub.prototype.broadcast = function (channel, data) {
  debug('broadcasting', channel, data)
  for (var p in this.peers) {
    var messageBlob = JSON.stringify({
      channel: channel,
      data: data
    })
    this.peers[p].write(Buffer([MESSAGE_TYPE_SWARMHUB]) + Buffer(messageBlob))
  }
}

SwarmHub.prototype.subscribe = function (channel) {
  var subscriber = new stream.PassThrough({objectMode: true})
  debug('subscribing', channel)

  if (!this.subscribers[channel]) this.subscribers[channel] = []
  this.subscribers[channel].push(subscriber)
  return subscriber
}

SwarmHub.prototype.destroy = function () {
  for (var p in this.peers) {
    this.peers[p].destroy(assert.ifError)
  }
  this.peers = null
  this.backingSwarm = null
}

module.exports = SwarmHub
