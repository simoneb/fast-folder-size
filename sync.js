'use strict'

const path = require('path')
const { execSync } = require('child_process')

function fastFolderSize(target) {
  // windows
  if (process.platform === 'win32') {
    const stdout = execSync(
      `"${path.join(
        __dirname,
        'bin',
        'du.exe'
      )}" -nobanner -accepteula -q -c .`,
      { cwd: target }
    )

    // query stats indexes from the end since path can contain commas as well
    const stats = stdout.split('\n')[1].split(',')

    return +stats.slice(-2)[0]
  }

  // mac
  if (process.platform === 'darwin') {
    const stdout = execSync(`du -sk .`, { cwd: target })

    const match = /^(\d+)/.exec(stdout)

    const bytes = Number(match[1]) * 1024

    return bytes
  }

  // others
  const stdout = execSync(`du -sb .`, { cwd: target })

  const match = /^(\d+)/.exec(stdout)

  const bytes = Number(match[1])

  return bytes
}

module.exports = fastFolderSize
