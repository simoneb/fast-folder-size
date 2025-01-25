const { test } = require('tap')
const crypto = require('crypto')

const fastFolderSize = require('.')
const fastFolderSizeSync = require('./sync')

test('callback', async t => {
  await t.test('folder size is larger than 0', t => {
    fastFolderSize('.', (err, bytes) => {
      t.error(err)
      t.ok(Number.isFinite(bytes))
      t.ok(bytes > 0)
      t.end()
    })
  })

  await t.test('folder size is correct', t => {
    const writtenBytes = 8 * 1024

    const testdirName = t.testdir({
      whatever: crypto.randomBytes(writtenBytes),
    })

    fastFolderSize(testdirName, (err, bytes) => {
      t.error(err)
      console.log('real size:', writtenBytes, 'found size:', bytes)
      t.ok(bytes >= writtenBytes)
      t.ok(bytes <= writtenBytes * 1.5)
      t.end()
    })
  })

  await t.test('should be able to cancel the operation', t => {
    const controller = new AbortController()

    fastFolderSize('.', { signal: controller.signal }, (err, bytes) => {
      t.ok(err)
      t.equal(err.name, 'AbortError')
      t.notOk(bytes)
      t.end()
    })

    controller.abort()
  })
})

test('sync', async t => {
  await t.test('sync: folder size is larger than 0', t => {
    const bytes = fastFolderSizeSync('.')
    t.ok(Number.isFinite(bytes))
    t.ok(bytes > 0)
    t.end()
  })

  await t.test('sync: folder size is correct', t => {
    const writtenBytes = 8 * 1024

    const testdirName = t.testdir({
      whatever: crypto.randomBytes(writtenBytes),
    })

    const bytes = fastFolderSizeSync(testdirName)
    console.log('real size:', writtenBytes, 'found size:', bytes)
    t.ok(bytes >= writtenBytes)
    t.ok(bytes <= writtenBytes * 1.5)
    t.end()
  })
})
