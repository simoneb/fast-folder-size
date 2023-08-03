const fs = require('fs')
const os = require('os')
const https = require('https')
const path = require('path')
const decompress = require('decompress')
const { HttpsProxyAgent } = require('https-proxy-agent')

exports.workspace = __dirname

exports.onDuZipDownloaded = function (tempFilePath) {
  decompress(tempFilePath, path.join(exports.workspace, 'bin'))
}

exports.default = function () {
  // Only run for Windows
  if (process.platform !== 'win32') {
    process.exit(0)
    return
  }

  // check if du is already installed
  if (
    fs.existsSync(
      path.join(
        exports.workspace,
        'bin',
        `du${process.arch === 'x64' ? '64' : ''}.exe`
      )
    )
  ) {
    process.exit(0)
    return
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
    https.globalAgent = new HttpsProxyAgent(proxyAddress)
  }

  console.log(`downloading du.zip from ${duZipLocation}`)

  https.get(duZipLocation, function (res) {
    const tempFilePath = path.join(os.tmpdir(), 'du.zip')

    const fileStream = fs.createWriteStream(tempFilePath)
    res.pipe(fileStream)

    fileStream.on('finish', function () {
      fileStream.close()
      exports.onDuZipDownloaded(tempFilePath)
    })
  })
}

// only auto execute default() function when its invoked directly
if (require.main === module) {
  exports.default()
}
