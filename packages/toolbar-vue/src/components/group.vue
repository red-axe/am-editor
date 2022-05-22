<template>
    <div v-if="!!icon || !!content" class="editor-toolbar-group">
        <am-popover
        :get-popup-container="getPopupContainer"
        overlay-class-name="editor-toolbar-popover"
        :arrow-point-at-center="true"
        :placement="isMobile ? 'topRight' : undefined"
        >
            <template #content>
                <div :class="['editor-toolbar', {'editor-toolbar-mobile': isMobile && !popup,
								'editor-toolbar-popup': popup,}]" data-element="ui">
                    <template v-for="(item , index) in items" :key="index">
                        <am-button v-if="item.type === 'button'" :key="index" v-bind="item" placement="top" :engine="engine" />
                        <am-dropdown v-if="item.type === 'dropdown'" :key="index" v-bind="item" placement="top" :engine="engine" />
                        <am-color v-if="item.type === 'color'" :key="index" v-bind="item" placement="top" :engine="engine" />
                        <am-collapse v-if="item.type === 'collapse'" :key="index" v-bind="item" :engine="engine" />
                    </template>
                </div>
            </template>
            <am-button name="group-popover" :icon="icon" :content="content" />
        </am-popover>
    </div>
    <div class="editor-toolbar-group" v-if="!icon && !content">
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
import { isMobile } from '@aomao/engine'
import AmPopover from 'ant-design-vue/es/popover'
import AmButton from './button.vue'
import AmDropdown from './dropdown.vue'
import AmColor from './color/color.vue'
import AmCollapse from './collapse/collapse.vue'
import { groupProps } from "../types"
import 'ant-design-vue/es/popover/style'

export default defineComponent({
    name:"am-group",
    components:{
        AmButton,
        AmDropdown,
        AmColor,
        AmCollapse,
        AmPopover
    },
    props:groupProps,
    setup(){
        return {
            isMobile
        }
    },
    methods:{
        getPopupContainer:() => document.querySelector('.data-toolbar-popup-wrapper') || document.querySelector('.editor-toolbar') || document.body
    }
})
</script>
<style>
.editor-toolbar-group {
    padding: 4px;
    width: auto;
    border-left: 1px solid #e8e8e8;
    display: flex;
    align-items: stretch;
}

.editor-toolbar .editor-toolbar-group:nth-child(1) {
    border-left: none;
}
</style>
