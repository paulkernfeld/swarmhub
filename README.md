swarmhub makes a webrtc-swarm act like a signalhub.

Example
-------
See also `example.js` and `test/test.js`.

```javascript
var signalhub = require('signalhub')
var webrtcSwarm = require('webrtc-swarm')
var swarmhub = require('swarmhub')
var wrtc = require('wrtc')

// Using a real signalhub to bootstrap to our swarm
var bootstrapHub = signalhub('bootstrap', [ 'http://signalhub.example.com' ])

// Create two swarmhubs, which we'll connect together via WebRTC
// Note that these are bootstrapping via the real signalhub
var hub1 = swarmhub(webrtcSwarm(bootstrapHub, { wrtc: wrtc }))
var hub2 = swarmhub(webrtcSwarm(bootstrapHub, { wrtc: wrtc }))

// Subscribe to a channel, as you would with signalhub.
// This message is traveling via the swarm.
hub1.subscribe('/my-channel')
    .on('data', function (message) {
      console.log('hub 1 got a message:', message)
    })

// We're waiting until the peer is connected to broadcast.
// Otherwise we would be broadcasting to nobody.
hub2.dataSwarm.on('peer', function (peer, id) {
    hub2.broadcast('/my-channel', { hello: 'world' })
})
```
