const fs = require('fs')
const os = require('os')
const https = require('https')
const path = require('path')
const decompress = require('decompress')

// Only run for Windows
if (process.platform !== 'win32') {
  process.exit(0)
}

const duZipLocation =
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION ||
  'https://download.sysinternals.com/files/DU.zip'

https.get(duZipLocation, function (res) {
  const tempFilePath = path.join(os.tmpdir(), 'du.zip')

  const fileStream = fs.createWriteStream(tempFilePath)
  res.pipe(fileStream)

  fileStream.on('finish', function () {
    fileStream.close()
    decompress(tempFilePath, path.join(__dirname, 'bin'))
  })
})
