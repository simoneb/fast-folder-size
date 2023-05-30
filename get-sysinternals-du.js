const fs = require('fs')
const https = require('https')
const path = require('path')
const unzipper = require('unzipper')

// Only run for Windows
if (process.platform !== 'win32') {
  process.exit(0)
}

// check if du is already installed
if (fs.existsSync(path.join(__dirname, 'bin', 'du.exe'))) {
  process.exit(0)
}

const duZipLocation =
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION ||
  'https://download.sysinternals.com/files/DU.zip'

// checks for proxy variables in user environment
const proxy =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy

let options = {}

if (proxy) {
  options = new URL(proxy)
  options.rejectUnauthorized = false
}

https.get(
  {
    host: options.host,
    port: options.port,
    hostname: options.hostname,
    path: duZipLocation,
    agent: new https.Agent(options),
  },
  function (res) {
    res.pipe(unzipper.Extract({ path: path.join(__dirname, 'bin') }))
  }
)
