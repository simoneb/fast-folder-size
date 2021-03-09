'use strict'

const path = require('path')
const { exec } = require('child_process')

function fastFolderSize(target, cb) {
  if (process.platform === 'win32') {
    exec(
      `${path.join(
        __dirname,
        'bin',
        'du.exe'
      )} -nobanner -accepteula ${target}`,
      (err, stdout) => {
        if (err) {
          return cb(err)
        }

        const match = /Size:\s+(.+) bytes/.exec(stdout)

        const bytes = match[1].replace(/\./g, '')

        cb(null, bytes)
      }
    )
  } else {
    exec(`du -s ${target}`, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      const match = /^(\d+)/.exec(stdout)

      const bytes = Number(match[1]) * 1024

      cb(null, bytes)
    })
  }
}

module.exports = fastFolderSize

if (require.main === module) {
  fastFolderSize(process.argv.slice(2)[0], (err, result) => {
    if (err) {
      throw err
    }

    console.log(result)
  })
}
