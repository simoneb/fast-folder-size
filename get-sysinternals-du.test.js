if (process.platform !== 'win32') {
  // these test cases are only for win32
  return
}

const { test, beforeEach } = require('tap')
const path = require('path')
const os = require('os')
const fs = require('fs')
const subject = require('./get-sysinternals-du.js')

let workspace = path.join(os.tmpdir(), 'fast-folder-size-playground')
beforeEach(() => {
  if (fs.existsSync(workspace)) fs.rmSync(workspace, { recursive: true })
  fs.mkdirSync(workspace)
  subject.workspace = workspace
})

test('it can use local file path as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION', t => {
  let dummyDuZipPath = path.join(workspace, 'dummy-du.zip')
  fs.writeFileSync(dummyDuZipPath, '')
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyDuZipPath

  subject.onDuZipDownloaded = function (tempFilePath) {
    t.equal(dummyDuZipPath, tempFilePath)
    t.end()
  }

  subject.default()
})
test('it cannot use non-exists local file path as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION', t => {
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = path.join(
    workspace,
    'non-exists-dummy-du.zip'
  )

  t.throws(subject.default, error => {
    return error.message.startsWith('du.zip not found at')
  })
  t.end()
})

test('it can use http(s) url as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION', t => {
  let dummyUrl = 'https://non-exists.localhost/du.zip'
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyUrl

  subject.downloadDuZip = function (mirror) {
    t.equal(dummyUrl, mirror)
    t.end()
  }

  subject.default()
})

test('when process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION not found, then download it directly', t => {
  delete process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION

  subject.downloadDuZip = function (mirror) {
    t.equal(undefined, mirror)
    t.end()
  }

  subject.default()
})
