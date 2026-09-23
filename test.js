const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { promisify } = require('node:util')

const fastFolderSize = require('.')
const fastFolderSizeSync = require('./sync')

const fastFolderSizeAsync = promisify(fastFolderSize)

function testdir(t, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fast-folder-size-test-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))

  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content)
  }

  return dir
}

test('callback', async t => {
  await t.test('folder size is larger than 0', async () => {
    const bytes = await fastFolderSizeAsync('.')
    assert.ok(Number.isFinite(bytes))
    assert.ok(bytes > 0)
  })

  await t.test('folder size is correct', async t => {
    const writtenBytes = 8 * 1024

    const testdirName = testdir(t, {
      whatever: crypto.randomBytes(writtenBytes),
    })

    const bytes = await fastFolderSizeAsync(testdirName)
    t.diagnostic(`real size: ${writtenBytes} found size: ${bytes}`)
    assert.ok(bytes >= writtenBytes)
    assert.ok(bytes <= writtenBytes * 1.5)
  })

  await t.test('should be able to cancel the operation', async () => {
    const controller = new AbortController()

    const result = new Promise(resolve =>
      fastFolderSize('.', { signal: controller.signal }, (err, bytes) =>
        resolve({ err, bytes }),
      ),
    )

    controller.abort()

    const { err, bytes } = await result
    assert.ok(err)
    assert.equal(err.name, 'AbortError')
    assert.ok(!bytes)
  })
})

test('sync', async t => {
  await t.test('sync: folder size is larger than 0', () => {
    const bytes = fastFolderSizeSync('.')
    assert.ok(Number.isFinite(bytes))
    assert.ok(bytes > 0)
  })

  await t.test('sync: folder size is correct', t => {
    const writtenBytes = 8 * 1024

    const testdirName = testdir(t, {
      whatever: crypto.randomBytes(writtenBytes),
    })

    const bytes = fastFolderSizeSync(testdirName)
    t.diagnostic(`real size: ${writtenBytes} found size: ${bytes}`)
    assert.ok(bytes >= writtenBytes)
    assert.ok(bytes <= writtenBytes * 1.5)
  })
})
