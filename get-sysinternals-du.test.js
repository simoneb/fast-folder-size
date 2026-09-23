if (process.platform !== 'win32') {
  // these test cases are only for win32
  return
}

const { test, beforeEach } = require('tap')
const path = require('path')
const os = require('os')
const fs = require('fs')
const subject = require('./get-sysinternals-du.js')

const workspace = path.join(os.tmpdir(), 'fast-folder-size-playground')
beforeEach(() => {
  if (fs.existsSync(workspace)) fs.rmSync(workspace, { recursive: true })
  fs.mkdirSync(workspace)
})

test('it can use local file path as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION', t => {
  t.test('C:\\**\\du.zip', t => {
    const dummyDuZipPath = path.join(workspace, 'dummy-du.zip')
    fs.writeFileSync(dummyDuZipPath, '')
    process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyDuZipPath

    subject.onDuZipDownloaded = function (tempFilePath) {
      t.equal(tempFilePath, dummyDuZipPath)
      t.end()
    }

    subject.default(workspace)
  })

  t.test('C://**/du.zip', t => {
    const dummyDuZipPath = path
      .join(workspace, 'dummy-du.zip')
      .replaceAll('\\', '/')
      .replace(':/', '://')
    fs.writeFileSync(dummyDuZipPath, '')
    process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyDuZipPath

    subject.onDuZipDownloaded = function (tempFilePath) {
      t.equal(tempFilePath, dummyDuZipPath)
      t.end()
    }

    subject.default(workspace)
  })

  t.end()
})

test('it cannot use non-exists local file path as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION', t => {
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = path.join(
    workspace,
    'non-exists-dummy-du.zip'
  )

  t.throws(
    () => subject.default(workspace),
    error => {
      return error.message.startsWith('du.zip not found at')
    }
  )

  t.end()
})

test('it can use http(s) url as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION', t => {
  const dummyUrl = 'https://non-exists.localhost/du.zip'
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyUrl

  subject.downloadDuZip = function (mirror) {
    t.equal(mirror, dummyUrl)
    t.end()
  }

  subject.default(workspace)
})

test('when process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION not found, then download it directly', t => {
  delete process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION

  subject.downloadDuZip = function (mirror) {
    t.equal(mirror, undefined)
    t.end()
  }

  subject.default(workspace)
})

test('extractDuZip copies only the known du.zip entries into bin', t => {
  const bin = path.join(workspace, 'bin')

  subject.extractDuZip(path.join(__dirname, 'fixtures', 'du.zip'), bin)

  t.same(fs.readdirSync(bin).sort(), [
    'Eula.txt',
    'du.exe',
    'du64.exe',
    'du64a.exe',
  ])
  t.equal(fs.readFileSync(path.join(bin, 'du64.exe'), 'utf8'), 'fake du64.exe')
  t.end()
})

test('extractDuZip never writes outside the destination (zip slip)', t => {
  const bin = path.join(workspace, 'bin')
  const outside = [
    // relative to the destination
    path.join(workspace, 'escaped.txt'),
    path.join(workspace, 'escaped-via-link.txt'),
    path.join(path.dirname(workspace), 'escaped-deeper.txt'),
    // relative to the current directory, in case anything extracts there
    path.join(process.cwd(), 'link'),
    path.join(path.dirname(process.cwd()), 'escaped.txt'),
  ]

  subject.extractDuZip(path.join(__dirname, 'fixtures', 'zip-slip.zip'), bin)

  t.same(fs.readdirSync(bin), ['du.exe'])
  for (const file of outside) {
    t.notOk(fs.existsSync(file), `${file} must not exist`)
  }
  t.end()
})
