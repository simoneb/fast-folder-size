'use strict'

const { exec } = require('child_process')
const { commands, processOutput } = require('./os.js')

function fastFolderSize(target, cb) {
  const command = commands[process.platform] || commands['linux']

  return exec(
    command,
    { cwd: target },
    (err, stdout) => {
      if (err) return cb(err)

      const process = processOutput[process.platform] || processOutput['linux']
      const bytes = process(stdout)

      cb(null, bytes)
    }
  )
}

module.exports = fastFolderSize
