<template>
    <div class="editor-toolbar-group">
        <template v-for="(item , index) in items" :key="index">
            <am-button v-if="item.type === 'button'" :key="index" v-bind="item" :engine="engine" />
            <am-dropdown v-if="item.type === 'dropdown'" :key="index" v-bind="item" :engine="engine" />
            <am-color v-if="item.type === 'color'" :key="index" v-bind="item" :engine="engine" />
            <am-collapse v-if="item.type === 'collapse'" :key="index" v-bind="item" :engine="engine" />
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import AmButton from './button.vue'
import AmDropdown from './dropdown.vue'
import AmColor from './color/color.vue'
import AmCollapse from './collapse/collapse.vue'
import { groupProps } from "../types"

export default defineComponent({
    name:"am-group",
    components:{
        AmButton,
        AmDropdown,
        AmColor,
        AmCollapse
    },
    props:groupProps
})
</script>
<style>
.editor-toolbar-group {
    padding: 4px 8px;
    width: auto;
    display: inline-block;
    border-left: 1px solid #e8e8e8;
}

.editor-toolbar .editor-toolbar-group:nth-child(1) {
    border-left: none;
}
</style>