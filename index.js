#!/usr/bin/env node
'use strict'

const path = require('path')
const { exec } = require('child_process')

function fastFolderSize(target, cb) {
  // windows
  if (process.platform === 'win32') {
    return exec(
      `"${path.join(
        __dirname,
        'bin',
        'du.exe'
      )}" -nobanner -accepteula ${target}`,
      (err, stdout) => {
        if (err) return cb(err)

        const match = /Size:\s+(.+) bytes/.exec(stdout)
        const bytes = Number(match[1].replace(/\.|,/g, ''))

        cb(null, bytes)
      }
    )
  }

  // mac
  if (process.platform === 'darwin') {
    return exec(`du -sk ${target}`, (err, stdout) => {
      if (err) return cb(err)

      const match = /^(\d+)/.exec(stdout)

      const bytes = Number(match[1]) * 1024

      cb(null, bytes)
    })
  }

  // others
  return exec(`du -sb ${target}`, (err, stdout) => {
    if (err) return cb(err)

    const match = /^(\d+)/.exec(stdout)

    const bytes = Number(match[1])

    cb(null, bytes)
  })
}

module.exports = fastFolderSize

if (require.main === module) {
  fastFolderSize(process.argv.slice(2)[0], (err, bytes) => {
    if (err) {
      throw err
    }

    console.log(bytes)
  })
}
