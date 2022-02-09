import { App } from 'vue'
import type { UserModule } from '~/types'

// inject into Vue
export const injectToVue = (app: App, name: string, target: unknown) => {
  app.config.globalProperties[`$${name}`] = target
}

export const install: UserModule = ({ app }) => {
  const inject = (name: string, target: unknown) => {
    injectToVue(app, name, target)
  }
  // demo
  inject('name', 'Modern Vue Stack')
}
