const fs = require('fs')
const os = require('os')
const https = require('https')
const path = require('path')
const { execFileSync } = require('child_process')
const { HttpsProxyAgent } = require('https-proxy-agent')

// the only entries of DU.zip we need; nothing else is ever written into bin/
const DU_ZIP_ENTRIES = ['du.exe', 'du64.exe', 'du64a.exe', 'Eula.txt']

// the bsdtar shipped with Windows 10+ reads zip archives. use it by full path
// so that a GNU tar found earlier on PATH (e.g. Git for Windows) isn't picked
// up instead
function windowsTar() {
  return path.join(
    process.env.SystemRoot || 'C:\\Windows',
    'System32',
    'tar.exe',
  )
}

// tar is only ever asked to list the archive and to stream single entries to
// stdout, never to write to disk: the files are written here, by name, into
// destDir. entry paths, `..` components and links inside the archive can
// therefore never decide where anything is written
exports.extractDuZip = function (zipPath, destDir, tar = windowsTar()) {
  const run = args => execFileSync(tar, args, { maxBuffer: 64 * 1024 * 1024 })

  const entries = run(['-tf', zipPath]).toString().split(/\r?\n/)

  fs.mkdirSync(destDir, { recursive: true })

  for (const entry of DU_ZIP_ENTRIES) {
    if (entries.includes(entry)) {
      fs.writeFileSync(path.join(destDir, entry), run(['-xOf', zipPath, entry]))
    }
  }
}

exports.onDuZipDownloaded = function (tempFilePath, workspace) {
  exports.extractDuZip(tempFilePath, path.join(workspace, 'bin'))
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
      `if you have trouble while downloading, try set process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION to a proper mirror or local file path`,
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
