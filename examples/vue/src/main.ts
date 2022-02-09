// windicss layers
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
// your custom styles here
import './styles/main.css'
// windicss utilities should be the last style import
import 'virtual:windi-utilities.css'
// windicss devtools support (dev only)
import 'virtual:windi-devtools'

import App from './App.vue'
// register vue composition api globally
import { ViteSSG } from 'vite-ssg'
import generatedRoutes from 'virtual:generated-pages'
import microApp from '@micro-zoe/micro-app'
import { setupLayouts } from 'virtual:generated-layouts'

const routes = setupLayouts(generatedRoutes)
// @ts-ignore
microApp.start({
  lifeCycles: {
    created() {
      console.log('created 全局监听')
    },
    beforemount() {
      console.log('beforemount 全局监听')
    },
    mounted() {
      console.log('mounted 全局监听')
    },
    unmount() {
      console.log('unmount 全局监听')
    },
    error() {
      console.log('error 全局监听')
    },
  },
  plugins: {
    modules: {
      react: [
        {
          loader(code: string, url: string) {
            if (
              process.env.NODE_ENV === 'development' &&
              code.indexOf('sockjs-node') > -1
            ) {
              console.log('react17插件', url)
              code = code.replace('window.location.port', '3002')
            }
            return code
          },
        },
      ],
    },
  },
})

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  (ctx) => {
    // install all modules under `modules/`
    Object.values(import.meta.globEager('./modules/*.ts')).forEach((i) =>
      i.install?.(ctx)
    )
  }
)
