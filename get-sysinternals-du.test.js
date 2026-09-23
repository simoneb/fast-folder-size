const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const os = require('node:os')
const fs = require('node:fs')
const subject = require('./get-sysinternals-du.js')

// these test cases are only for win32
const skip = process.platform !== 'win32'

const workspace = path.join(os.tmpdir(), 'fast-folder-size-playground')
beforeEach(() => {
  if (fs.existsSync(workspace)) fs.rmSync(workspace, { recursive: true })
  fs.mkdirSync(workspace)
})

test(
  'it can use local file path as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION',
  { skip },
  async t => {
    await t.test('C:\\**\\du.zip', () => {
      const dummyDuZipPath = path.join(workspace, 'dummy-du.zip')
      fs.writeFileSync(dummyDuZipPath, '')
      process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyDuZipPath

      let received
      subject.onDuZipDownloaded = tempFilePath => (received = tempFilePath)

      subject.default(workspace)
      assert.equal(received, dummyDuZipPath)
    })

    await t.test('C://**/du.zip', () => {
      const dummyDuZipPath = path
        .join(workspace, 'dummy-du.zip')
        .replaceAll('\\', '/')
        .replace(':/', '://')
      fs.writeFileSync(dummyDuZipPath, '')
      process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyDuZipPath

      let received
      subject.onDuZipDownloaded = tempFilePath => (received = tempFilePath)

      subject.default(workspace)
      assert.equal(received, dummyDuZipPath)
    })
  },
)

test(
  'it cannot use non-exists local file path as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION',
  { skip },
  () => {
    process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = path.join(
      workspace,
      'non-exists-dummy-du.zip',
    )

    assert.throws(() => subject.default(workspace), {
      message: /^du\.zip not found at/,
    })
  },
)

test(
  'it can use http(s) url as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION',
  { skip },
  () => {
    const dummyUrl = 'https://non-exists.localhost/du.zip'
    process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyUrl

    let received
    subject.downloadDuZip = mirror => (received = mirror)

    subject.default(workspace)
    assert.equal(received, dummyUrl)
  },
)

test(
  'when process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION not found, then download it directly',
  { skip },
  () => {
    delete process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION

    let called = false
    let received
    subject.downloadDuZip = mirror => {
      called = true
      received = mirror
    }

    subject.default(workspace)
    assert.ok(called)
    assert.equal(received, undefined)
  },
)

test(
  'extractDuZip copies only the known du.zip entries into bin',
  { skip },
  () => {
    const bin = path.join(workspace, 'bin')

    subject.extractDuZip(path.join(__dirname, 'fixtures', 'du.zip'), bin)

    assert.deepEqual(fs.readdirSync(bin).sort(), [
      'Eula.txt',
      'du.exe',
      'du64.exe',
      'du64a.exe',
    ])
    assert.equal(
      fs.readFileSync(path.join(bin, 'du64.exe'), 'utf8'),
      'fake du64.exe',
    )
  },
)

test(
  'extractDuZip never writes outside the destination (zip slip)',
  { skip },
  () => {
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

    assert.deepEqual(fs.readdirSync(bin), ['du.exe'])
    for (const file of outside) {
      assert.ok(!fs.existsSync(file), `${file} must not exist`)
    }
  },
)
