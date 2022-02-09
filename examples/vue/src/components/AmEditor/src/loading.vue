<template>
  <a-spin class="loading" :tip="text" :spinning="loading">
    <slot></slot>
  </a-spin>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ASpin from 'ant-design-vue/es/spin'
import 'ant-design-vue/es/spin/style'

export default defineComponent({
  name: 'AmLoading',
  components: {
    ASpin,
  },
  props: {
    text: String,
    loading: Boolean,
  },
})
</script>
<style css>
.loading {
  padding: 20px;
  display: block;
}

.ant-spin-nested-loading {
  position: inherit;
}
.ant-spin-nested-loading .ant-spin-container {
  position: inherit;
}
</style>
