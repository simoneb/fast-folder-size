const https = require('https')
const path = require('path')
const unzipper = require('unzipper')

https.get('https://download.sysinternals.com/files/DU.zip', function (res) {
  res.pipe(unzipper.Extract({ path: path.join(__dirname, 'bin') }))
})
