var signalhub = require('signalhub')
var signalhubServer = require('signalhub/server')
var swarmhub = require('..')
var webrtcSwarm = require('webrtc-swarm')
var tape = require('tape')
var wrtc = require('wrtc')

tape('make a real swarmhub', function (t) {
  var server = signalhubServer()
  server.listen(0, function () {
    var port = server.address().port
    var bootstrapHub1 = signalhub('bootstrap', [ 'http://localhost:' + port ])
    var bootstrapHub2 = signalhub('bootstrap', [ 'http://localhost:' + port ])

    var hub1 = swarmhub(webrtcSwarm(bootstrapHub1, { wrtc: wrtc }))
    var hub2 = swarmhub(webrtcSwarm(bootstrapHub2, { wrtc: wrtc }))

    var swarm1 = hub1.dataSwarm
    var swarm2 = hub2.dataSwarm

    var nRemaining = 2
    var endTest = function () {
      nRemaining--
      if (nRemaining > 0) return

      hub1.destroy()
      hub2.destroy()
      server.close()
      t.end()

      // TODO figure out how to properly destroy a webrtc-swarm
      process.exit(0)
    }

    hub1.subscribe('/my-channel')
      .on('data', function (message) {
        t.same(message, { hello: 'world' }, 'swarmhub message')
        endTest()
      })

    swarm1.on('peer', function (peer, id) {
      peer.write(Buffer('hi'))
    })

    swarm2.on('peer', function (peer, id) {
      // No point broadcasting before we're connected to anyone
      hub2.broadcast('/my-channel', { hello: 'world' })

      peer.on('data', function (data) {
        t.same(data, Buffer('hi'), 'normal swarm message')
        endTest()
      })
    })
  })
})
