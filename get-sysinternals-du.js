const fs = require('fs')
const os = require('os')
const https = require('https')
const path = require('path')
const decompress = require('decompress')
const { HttpsProxyAgent } = require('https-proxy-agent')

exports.onDuZipDownloaded = function (tempFilePath, workspace) {
  decompress(tempFilePath, path.join(workspace, 'bin'))
}

exports.downloadDuZip = function (mirror, workspace) {
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
      exports.onDuZipDownloaded(tempFilePath, workspace)
    })
  })
}

exports.default = function (workspace) {
  // Only run for Windows
  if (process.platform !== 'win32') {
    return
  }

  // check if du is already installed
  const duBinFilename = `du${process.arch === 'x64' ? '64' : ''}.exe`
  const defaultDuBinPath = path.join(workspace, 'bin', duBinFilename)

  if (fs.existsSync(defaultDuBinPath)) {
    console.log(`${duBinFilename} found at ${defaultDuBinPath}`)
    return
  }
  console.log(`${duBinFilename} not found at ${defaultDuBinPath}`)

  const mirrorOrCache = process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION

  if (
    !mirrorOrCache ||
    mirrorOrCache.startsWith('http://') ||
    mirrorOrCache.startsWith('https://')
  ) {
    exports.downloadDuZip(mirrorOrCache, workspace)
    return
  }

  if (fs.existsSync(mirrorOrCache)) {
    exports.onDuZipDownloaded(mirrorOrCache, workspace)
    return
  }

  const message = `du.zip not found at ${mirrorOrCache}`
  // this will result the process to exit with code 1
  throw Error(message)
}

// only auto execute default() function when its invoked directly
if (require.main === module) {
  exports.default(__dirname)
}
