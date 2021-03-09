const assert = require('assert')

const fastFolderSize = require('.')

fastFolderSize('.', (err, bytes) => {
  assert.ifError(err)
  assert(Number.isFinite(bytes))
  assert(bytes > 0)
})
