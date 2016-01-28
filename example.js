var signalhub = require('signalhub')
var signalhubServer = require('signalhub/server')
var webrtcSwarm = require('webrtc-swarm')
var swarmhub = require('.')
var wrtc = require('wrtc')

var server = signalhubServer()
server.listen(9000, function () {
  var bootstrapHub = signalhub('bootstrap', [ 'http://localhost:9000' ])

  var hub1 = swarmhub(webrtcSwarm(bootstrapHub, { wrtc: wrtc }))
  var hub2 = swarmhub(webrtcSwarm(bootstrapHub, { wrtc: wrtc }))

  hub1.subscribe('/my-channel')
    .on('data', function (message) {
      console.log('hub 1 got a message:', message)
    })

  hub2.dataSwarm.on('peer', function (peer, id) {
    hub2.broadcast('/my-channel', { hello: 'world' })
  })
})
