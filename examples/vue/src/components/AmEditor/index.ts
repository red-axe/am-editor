import type { App } from 'vue'
import Comp from './src/main.vue'

Comp.install = function (Vue: App) {
  Vue.component(Comp.name, Comp)
}

export default Comp
