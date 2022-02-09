const fs = require('fs')
const { upToHWOSS } = require('./upToHW')

// 得出cdn路径前缀
const calcCdnPathSuffix = (mode) => {
  const v = fs.readFileSync('./config/version.txt', 'utf-8')

  const prefix = `desktop/${mode}`

  let suffix = `${prefix}/latest`

  if (v) {
    suffix = `${prefix}/${v}`
  }
  return suffix
}

const mode = process.env.MODE || 'development'

upToHWOSS(calcCdnPathSuffix(mode))
