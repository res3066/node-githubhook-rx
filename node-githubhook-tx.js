#!/opt/local/bin/node
//
// complement to node-githubhook-tx.js - a simple fake github push hook notifier
// for those of us who like gitolite more than github
//

const http = require('http')
const crypto = require('crypto');

const secret = process.env.SECRET ? process.env.SECRET : 'badsecret';

let now = new Date();
let ts = now.toISOString();

const data = JSON.stringify({
  psst: 'Fake Github here...',
  "hook": {
    "events": [
      "push"
    ],
    updated_at: ts
  }
})

let sig = "sha1=" + crypto.createHmac('sha1', secret).update(data).digest('hex');

var options = {
    hostname: process.env.HOST ? process.env.HOST : 'myblog.example.org',
    port: process.env.PORT ? process.env.PORT : 8080,
    path: '/notify',
    method: 'POST',
    headers: {
	'Content-Type': 'application/json',
	'Content-Length': data.length,
	'x-github-event': 'push',
	'x-hub-signature': sig
    }
}

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`)
  res.on('data', (d) => {
    process.stdout.write(d)
  })
})

req.on('error', (error) => {
  console.error(error)
})

req.write(data)
req.end()

