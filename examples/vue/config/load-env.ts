import * as dotenv from 'dotenv'

export interface ViteEnv {
  VITE_URL: string
  VITE_BASE_URL: string
  VITE_ZIP_NAME: string
  VITE_BASE_API: string
  VITE_BUILD_DROP_CONSOLE: string
  VITE_CDN_BASE: string
}

// 通过dotenv配置 需要加载指定.env文件 这样process.env打印到得就是对应得文件了
// 这里的mode是我们启动时候的参数 npm run dev:prc 得到的mode就是prc
export function loadEnv(mode: string): ViteEnv {
  const ret: any = {}
  // 在使用之前我们先指定加载哪个环境变量
  dotenv.config({
    path: `.env.${mode}`, // .env.prc
  })

  for (const envName of Object.keys(process.env)) {
    const realName = (process.env as any)[envName].replace(/\\n/g, '\n')
    ret[envName] = realName
    // inject VITE_XXX into process.env
    process.env[envName] = realName
  }
  return ret
}
const regExps = (value: string, reg: string): string => {
  return value.replace(new RegExp(reg, 'g'), '')
}

//  proxy
export function createProxy(targetProxyUrl: string, baseUrl: string) {
  return {
    [`${baseUrl}`]: {
      target: targetProxyUrl,
      changeOrigin: true,
      rewrite: (path: string) => regExps(path, `${baseUrl}`),
    },
  }
}
