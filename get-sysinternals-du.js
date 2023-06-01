const fs = require('fs')
const os = require('os')
const https = require('https')
const path = require('path')
const decompress = require('decompress')

// Only run for Windows
if (process.platform !== 'win32') {
  process.exit(0)
}

// check if du is already installed
if (
  fs.existsSync(
    path.join(__dirname, 'bin', `du${process.arch === 'x64' ? '64' : ''}.exe`)
  )
) {
  process.exit(0)
}

const duZipLocation =
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION ||
  'https://download.sysinternals.com/files/DU.zip'

// checks for proxy variables in user environment
const proxyAddress =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy

if (proxyAddress) {
  const proxyOptions = new URL(proxyAddress)
  const agent = new https.Agent({
    proxy: {
      host: proxyOptions.hostname,
      port: proxyOptions.port || 8080,
      protocol: proxyOptions.protocol,
      auth: proxyOptions.auth,
    },
  })

  https.globalAgent = agent
}

https.get(duZipLocation, function (res) {
  const tempFilePath = path.join(os.tmpdir(), 'du.zip')

  const fileStream = fs.createWriteStream(tempFilePath)
  res.pipe(fileStream)

  fileStream.on('finish', function () {
    fileStream.close()
    decompress(tempFilePath, path.join(__dirname, 'bin'))
  })
})
