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

exports.downloadDuZip = function () {
  let mirror = process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION
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
      `if you have trouble while downloading, try set process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION to a proper mirror`
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

exports.onDuBinCopied = function (filename, src, dest) {
  console.log(`${filename} copied from ${src} to ${dest}`)
}

exports.default = function () {
  // Only run for Windows
  if (process.platform !== 'win32') {
    return
  }

  // check if du is already installed
  let duBinFilename = `du${process.arch === 'x64' ? '64' : ''}.exe`
  let envDuBinPath = process.env.FAST_FOLDER_SIZE_DU_BIN
  let defaultDuBinPath = path.join(exports.workspace, 'bin', duBinFilename)

  if (fs.existsSync(defaultDuBinPath)) {
    return
  } else {
    console.log(`${duBinFilename} not found at ${defaultDuBinPath}`)

    if (fs.existsSync(envDuBinPath)) {
      fs.mkdirSync(path.dirname(defaultDuBinPath))
      fs.copyFileSync(envDuBinPath, defaultDuBinPath)
      exports.onDuBinCopied(duBinFilename, envDuBinPath, defaultDuBinPath)
      return
    }

    console.log(
      `${duBinFilename} not found at process.env.FAST_FOLDER_SIZE_DU_BIN`
    )
  }

  exports.downloadDuZip()
}

// only auto execute default() function when its invoked directly
if (require.main === module) {
  exports.default()
}
