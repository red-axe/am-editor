<template>
    <div
    :class="['toolbar-dropdown toolbar-collapse', {'toolbar-dropdown-right': isRight},className]"
    ref="collapse"
    >
    <am-button
    v-if="!isCustomize"
    name="collapse"
    :icon="icon"
    :content="content"
    :on-click="triggerClick"
    :active="visible"
    :disabled="disabled"
    />
    <div v-if="visible" class="toolbar-dropdown-list" data-element="ui">
        <slot name="header">
            <div v-if="header" class="toolbar-collapse-header" v-html="header" />
        </slot>
        <div class="toolbar-collapse-content">
            <am-collapse-group 
            v-for="(group,index) in groups"
            :key="index"
            :engine="engine"
            v-bind="group"
            :on-select="triggerSelect"
            />
        </div>
    </div>
</div>
</template>
<script lang="ts">
import { defineComponent, onUnmounted, ref } from 'vue'
import { collapseProps } from '../../types';
import { useRight } from '../../hooks';
import AmButton from '../button.vue';
import AmCollapseGroup from './group.vue';

export default defineComponent({
    name:"am-collapse",
    components:{
        AmButton,
        AmCollapseGroup
    },
    props:collapseProps,
    setup(props){
        const isCustomize = !!!(props.icon || props.content);
        const visible = ref(isCustomize);
        const collapse = ref<HTMLElement | null>(null);

        const isRight = useRight(collapse)

        onUnmounted(() => {
            if(isCustomize) document.removeEventListener('click', hide);
        })

        const show = () => {
            visible.value = true
            setTimeout(() => {
                document.addEventListener('click', hide);
            }, 10);
        };

        const hide = (event?: MouseEvent) => {
            if (event) {
                // let node = event.target;
                // while (node) {
                //     if (node === collapse.value) {
                //         return;
                //     }
                //     node = (node as Element).parentNode;
                // }
            }
            document.removeEventListener('click', hide);
            visible.value = false
        };

        const triggerClick = () => {
            if (visible.value) {
                hide();
            } else {
                show();
            }
        };

        const triggerSelect = (event:MouseEvent,name:string) => {
            
            hide()
            if(props.onSelect) props.onSelect(event,name)
        }

        return {
            isCustomize,
            visible,
            collapse,
            isRight,
            triggerClick,
            triggerSelect
        }
    }
})
</script>
<style>
.toolbar-collapse-header {
    color: #8c8c8c;
    margin: 4px 16px 0;
    font-size: 12px;
    line-height: 20px;
    text-align: left;
    padding-bottom: 8px;
    margin-bottom: 6px;
    border-bottom: 1px solid #e8e8e8;
}

.toolbar-collapse-header code{
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 2px;
    border: 1px solid #d9d9d9;
}

.toolbar-collapse-content {
    min-width: 200px
}

.toolbar-collapse-group-title {
    padding: 2px 16px;
    text-align: left;
    color: #8c8c8c;
    font-weight: 700;
    font-size: 12px;
    line-height: 24px;
}

.toolbar-collapse-item {
    display: flex;
    cursor: pointer;
    padding: 4px 16px 0;
}

.toolbar-collapse-item-active {
    background-color: #f4f4f4;
}

.editor-toolbar .toolbar-collapse-item-disabled, .data-toolbar-component-list .toolbar-collapse-item-disabled, .editor-toolbar:not(.editor-toolbar-mobile) .toolbar-collapse-item-disabled:hover,  .data-toolbar-component-list .toolbar-collapse-item-disabled:hover {
  background-color: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  color: #000000;
  opacity: 0.25;
  cursor: not-allowed;
}

.toolbar-collapse-item .toolbar-collapse-item-text
{
    display: block;
    text-align: left;
    margin-left: 8px;
}

.toolbar-collapse-item .toolbar-collapse-item-title{
    display: block;
    color: #595959;
    line-height: 24px;
    font-size: 14px;
    font-weight: normal;
}

.toolbar-collapse-item .toolbar-collapse-item-description
{
    display: block;
    font-size: 12px;
    color: rgba(0,0,0,.45);
}
</style>