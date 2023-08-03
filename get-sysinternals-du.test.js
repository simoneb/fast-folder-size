const { test, beforeEach } = require('tap')
const path = require('path')
const os = require('os')
const fs = require('fs')
const subject = require('./get-sysinternals-du.js')

beforeEach(() => {
  let workspace = path.join(os.tmpdir(), 'fast-folder-size-playground')
  if (fs.existsSync(workspace)) fs.rmSync(workspace, { recursive: true })
  fs.mkdirSync(workspace)
  subject.workspace = workspace
})

test('it cannot use local file path as process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION', t => {
  let dummyDuZipPath = path.join(os.tmpdir(), 'dummy-du.zip')
  let data = ''
  fs.writeFileSync(`${dummyDuZipPath}`, data)
  process.env.FAST_FOLDER_SIZE_DU_ZIP_LOCATION = dummyDuZipPath

  t.throws(subject.default, e => {
    return (
      e.code === 'ERR_INVALID_PROTOCOL' &&
      e.message.match('Protocol ".*:" not supported. Expected "https:"')
    )
  })
  t.end()
})
