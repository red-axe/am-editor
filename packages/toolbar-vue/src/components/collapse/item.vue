<template>
    <a-popover
    :placement="placement || 'right'"
    :content="typeof prompt === 'function' ? prompt() : prompt"
    :overlayStyle="prompt ? {} : {display:'none'}"
    >
        <div
        :class="['toolbar-collapse-item', { 'toolbar-collapse-item-active': active }, className]"
        @mouseenter="triggerMouseEnter"
        @mouseleave="triggerMouseLeave"
        @click="onClick"
        @mousedown="onMouseDown"
        >
            <slot name="icon">
                <span v-if="iconIsHtml" v-html="icon"></span>
                <span v-if="!iconIsHtml && icon" :class="`data-icon data-icon-${icon}`" />
            </slot>
            <div v-if="title" class="toolbar-collapse-item-text">
                <div class="toolbar-collapse-item-title">
                    {{title}}
                </div>
                <div v-if="description" class="toolbar-collapse-item-description">
                    {{description}}
                </div>
            </div>
        </div>
    </a-popover>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import APopover from 'ant-design-vue/es/popover'
import { collapseItemProps } from '../../types'
import 'ant-design-vue/es/popover/style'

export default defineComponent({
    name:"am-collapse-item",
    components:{
        APopover
    },
    props:collapseItemProps,
    setup(props){
        const active = ref(false);
        const onClick = (event: MouseEvent) => {

            const nodeName = (event.target as Node).nodeName;
            if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
                event.preventDefault();

            if (props.onClick && props.onClick(event,props.name) === false) {
                return;
            }
            if (props.autoExecute !== false) {
                let commandName = props.name;
                let commandArgs = [];
                if (props.command) {
                    if (!Array.isArray(props.command)) {
                        commandName = props.command.name;
                        commandArgs = props.command.args;
                    } else {
                        commandArgs = props.command;
                    }
                }
                props.engine?.command.execute(commandName, ...commandArgs);
            }
        };

        const triggerMouseEnter = () => {
            active.value = true
        }

        const triggerMouseLeave = () => {
            active.value = false
        }
        return {
            iconIsHtml:/^<.*>/.test(props.icon?.trim() || ""),
            active,
            onClick,
            triggerMouseEnter,
            triggerMouseLeave
        }
    }
})
</script>