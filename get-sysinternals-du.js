const https = require('https')
const path = require('path')
const unzipper = require('unzipper')

// Only run for Windows
if (process.platform !== 'win32') {
  process.exit(0)
}

const duZipLocation =
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION ||
  'https://download.sysinternals.com/files/DU.zip'

// checks for proxy variables in user environment
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy

if (proxy) {
  const options = new URL(proxy);
  options.rejectUnauthorized = false

  https.get({
    path: duZipLocation,    
    agent: new https.Agent(options)
  }, (res) => {
    res.pipe(unzipper.Extract({ path: path.join(__dirname, 'bin') }))
  })
} else {
  https.get({
    path: duZipLocation
  }, function (res) {
    res.pipe(unzipper.Extract({ path: path.join(__dirname, 'bin') }))
  })
}
