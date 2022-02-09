<template>
  <div class="red">
    <micro-app name="red" url="http://localhost:3002/" :data="data" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const data = ref({ from: '来自基座的初始化数据' })
</script>
