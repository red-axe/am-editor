<template>
    <div
    :class="['editor-toolbar', className]"
    data-element="ui"
    @mousedown="triggerMouseDown"
    @mouseover="triggerMouseOver"
    @mousemove="triggerMouseMove"
    @contextmenu="triggerContextMenu"
    >
        <div class="editor-toolbar-content">
            <am-group v-for="(group,index) in groups" :key="index" :engine="engine" :items="group" />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { merge, omit } from 'lodash-es';
import AmGroup from './group.vue'
import locales from '../locales';
import { getToolbarDefaultConfig } from '../config'
import { ToolbarItemProps, toolbarProps } from '../types'

export default defineComponent({
    name:"am-toolbar",
    components:{
        AmGroup
    },
    props:toolbarProps,
    setup(props){
        let groups = ref<Array<Array<ToolbarItemProps>>>([])
        const update = () => {
            const data: Array<Array<ToolbarItemProps>> = [];
            const defaultConfig = getToolbarDefaultConfig(props.engine);
            props.items.forEach(group => {
                const dataGroup: Array<ToolbarItemProps> = [];
                group.forEach(item => {
                    let customItem = undefined;
                    if (typeof item === 'string') {
                        const defaultItem = defaultConfig.find(config =>
                            item === 'collapse' ? config.type === item : config.type !== 'collapse' && config.name === item,
                        );
                        if (defaultItem) customItem = defaultItem;
                    } else {
                        const defaultItem = defaultConfig.find(config =>
                            item.type === 'collapse' ? config.type === item.type : config.type !== 'collapse' && config.name === item.name,
                        );
                        customItem = merge(omit(item, 'type'), defaultItem);
                    }
                    if (customItem) {
                        if (customItem.type === 'button') {
                            if (customItem.onActive)
                                customItem.active = customItem.onActive();
                            else if (props.engine.command.queryEnabled(customItem.name))
                                customItem.active = props.engine.command.queryState(
                                    customItem.name,
                                );
                        } else if (customItem.type === 'dropdown') {
                            if (customItem.onActive)
                                customItem.values = customItem.onActive();
                            else if (props.engine.command.queryEnabled(customItem.name))
                                customItem.values = props.engine.command.queryState(
                                    customItem.name,
                                );
                        }
                        if (customItem.type !== 'collapse' && customItem.onDisabled) customItem.disabled = customItem.onDisabled();
                        dataGroup.push(customItem);
                    }
                });
                if (dataGroup.length > 0) data.push(dataGroup);
            });
            groups.value = data
        }

        onMounted(() => {
            props.engine.language.add(locales)
            props.engine.on("select",update)
            props.engine.on("change",update)
            update()
        })

        onUnmounted(() => {
            props.engine.off("select",update)
            props.engine.off("change",update)
        })

        return {
            groups
        }
    },
    methods:{
        preventDefault(event:MouseEvent){
            event.preventDefault()
        },
        triggerMouseDown(){

        },
        triggerMouseOver(event:MouseEvent){
            this.preventDefault(event)
        },
        triggerMouseMove(event:MouseEvent){
            this.preventDefault(event)
        },
        triggerContextMenu(event:MouseEvent){
            this.preventDefault(event)
        }
    }
})
</script>
<style>
.ant-tooltip .toolbar-tooltip-title {
    font-size: 12px;
    text-align: center;
}

.ant-tooltip .toolbar-tooltip-hotkey {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.85);
    text-align: center;
}

.editor-toolbar {
    position: relative;
    width: 100%;
    padding:0;
    z-index: 200;
    border-top:1px solid rgba(0,0,0,.05);
    border-bottom: 1px solid rgba(0,0,0,.05);
    user-select: none;
}

.editor-toolbar .editor-toolbar-content {
    position: relative;
    flex-direction: row;
    background: transparent;
    text-align: center;
    width: 100%;
}
</style>