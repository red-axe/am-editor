const buildDir = 'build'
const ossBucket = 'mobile-static'

function upToHWOSS(suffix) {
  const glob = require('glob')
  const path = require('path')
  const ObsClient = require('esdk-obs-nodejs')

  const isWindow = /^win/.test(process.platform)

  let pre = path.resolve(__dirname, `../${buildDir}/`) + (isWindow ? '\\' : '')

  const files = glob.sync(
    `${path.join(
      __dirname,
      `../${buildDir}/**/*.?(js|json|ico|css|png|jpg|svg|woff|woff2|ttf|eot|gz)`
    )}`
  )
  pre = pre.replace(/\\/g, '/')
  // ObsClient fill your own
  const obsClient = new ObsClient({
    access_key_id: '',
    secret_access_key: '',
    server: '',
  })
  async function uploadFileCDN(files) {
    files.map(async (file) => {
      let key = getFileKey(pre, file)
      key = suffix + '/' + key
      try {
        await uploadFIle(key, file)
        console.log(`upload key: ${key}`)
      } catch (err) {
        console.log('error', err)
      }
    })
  }
  async function uploadFIle(key, localFile) {
    return new Promise((resolve, reject) => {
      obsClient.putObject(
        {
          Bucket: ossBucket,
          Key: key,
          SourceFile: localFile,
        },
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        }
      )
    })
  }
  function getFileKey(pre, file) {
    if (file.indexOf(pre) > -1) {
      const key = file.split(pre)[1]
      return key.startsWith('/') ? key.substring(1) : key
    }
    return file
  }

  ;(async () => {
    console.time('uploading to oss...')
    await uploadFileCDN(files)
    console.timeEnd('upload end')
  })()
}

module.exports = {
  upToHWOSS,
}
