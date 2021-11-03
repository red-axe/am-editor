<template>
    <span class="colorpicker-group">
        <am-color-picker-item v-for="color in colors"
        :engine="engine"
        :color="color.value"
        :active="color.active"
        :key="color.value"
        :on-select="onSelect"
        :set-stroke="setStroke"
        />
    </span>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { colorPickerGroupProps } from '../../../types'
import AmColorPickerItem from './item.vue'

export default defineComponent({
    name:"am-color-plicker-group",
    components:{
        AmColorPickerItem
    },
    props:colorPickerGroupProps,
})
</script>