<template>
  <div class="home">
    <engine-demo />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Select } from 'ant-design-vue'
import EngineDemo from '@/components/demo.vue';

export default defineComponent({
    components: {
        "a-select":Select,
        "a-select-option":Select.Option,
        EngineDemo
    }
})
</script>
