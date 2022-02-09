<template>
  <div class="mention-container">
    <p>This is name: {{ name }}</p>
    <p>配置 mention 插件的 onMouseEnter 方法</p>
    <p>此处使用 createApp().mount 自定义渲染</p>
    <p>Use createApp().mount to customize rendering here</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AmMention',
  props: {
    name: {
      type: String,
      default: '',
    },
  },
})
</script>
<style css>
.mention-container {
  padding: 5px;
}
</style>
