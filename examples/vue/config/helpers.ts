import * as fs from 'fs'

// calc cdn path suffix
export const calcCdnPathSuffix = (mode = 'development') => {
  const v = fs.readFileSync('./config/version.txt', 'utf-8')

  const prefix = `desktop/${mode}`

  let suffix = `${prefix}/latest`

  if (v) {
    suffix = `${prefix}/${v}`
  }
  return suffix
}
