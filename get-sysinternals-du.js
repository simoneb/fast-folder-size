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

exports.downloadDuZip = function (mirror) {
  const duZipLocation =
    mirror || 'https://download.sysinternals.com/files/DU.zip'

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
  if (!mirror) {
    console.log(
      `if you have trouble while downloading, try set process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION to a proper mirror or local file path`
    )
  }

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

exports.default = function () {
  // Only run for Windows
  if (process.platform !== 'win32') {
    return
  }

  // check if du is already installed
  let duBinFilename = `du${process.arch === 'x64' ? '64' : ''}.exe`
  let defaultDuBinPath = path.join(exports.workspace, 'bin', duBinFilename)

  if (fs.existsSync(defaultDuBinPath)) {
    console.log(`${duBinFilename} found at ${defaultDuBinPath}`)
    return
  } else {
    console.log(`${duBinFilename} not found at ${defaultDuBinPath}`)
  }

  let mirrorOrCache = process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION

  if (
    !mirrorOrCache ||
    mirrorOrCache.startsWith('http://') ||
    mirrorOrCache.startsWith('https://')
  ) {
    exports.downloadDuZip(mirrorOrCache)
  } else if (fs.existsSync(mirrorOrCache)) {
    exports.onDuZipDownloaded(mirrorOrCache)
  } else {
    let message = `du.zip not found at ${mirrorOrCache}`
    // this will result the process to exit with code 1
    throw Error(message)
  }
}

// only auto execute default() function when its invoked directly
if (require.main === module) {
  exports.default()
}
