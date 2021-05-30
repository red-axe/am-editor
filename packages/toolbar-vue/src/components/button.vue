<template>
    <a-tooltip :placement="placement || 'bottom'" :visible="!!title || !!hotkeyText ? visible : false">
        <template #title>
            <div v-if="!!title" class="toolbar-tooltip-title">{{title}}</div>
            <div v-if="!!hotkeyText" class="toolbar-tooltip-hotkey" v-html="hotkeyText"></div>
        </template>
        <button 
        :class="['toolbar-button',className,{'toolbar-button-active': active,'toolbar-button-disabled':disabled}]" 
        @click="triggerClick" 
        @mousedown="triggerMouseDown" 
        @mouseenter="triggerMouseEnter" 
        @mouseleave="triggerMouseLeave">
            <slot name="icon"><span v-if="icon" :class="['data-icon',`data-icon-${icon}`]" /></slot>
            <slot>{{typeof content === 'function' ? content() : content}}</slot>
        </button>
    </a-tooltip>
</template>
<script lang="ts">
import { defineComponent, ref} from "vue"
import ATooltip from "ant-design-vue/es/tooltip"
import { formatHotkey } from '@aomao/engine'
import { autoGetHotkey } from "../utils"
import { buttonProps } from "../types"
import 'ant-design-vue/es/tooltip/style/css'

export default defineComponent({
    name:"am-button",
    components:{
        ATooltip
    },
    props:buttonProps,
    setup(props){
        let hotkey = props.hotkey;
        //默认获取插件的热键
        if (props.engine && (hotkey === true || hotkey === undefined)) {
            hotkey = autoGetHotkey(
                props.engine,
                props.command && !Array.isArray(props.command) ? props.command.name : props.name,
            );
        }
        if (typeof hotkey === 'string' && hotkey !== '') {
            hotkey = formatHotkey(hotkey)
        }

        const visible = ref(false)

        return {
            visible,
            hotkeyText:hotkey
        }
    },
    data(){
        return {
            visible:false
        }
    },
    methods:{
        triggerMouseDown(event:MouseEvent){
            event.preventDefault();
            if (this.disabled) return;
            if (this.onMouseDown) this.onMouseDown(event);
            else {
                event.stopPropagation();
            }
            this.visible = false
        },
        triggerMouseEnter(event:MouseEvent){
            if(this.onMouseEnter) this.onMouseEnter(event)
            this.visible = true
        },
        triggerMouseLeave(event:MouseEvent){
            if(this.onMouseLevel) this.onMouseLevel(event)
            this.visible = false
        },
        triggerClick(event: MouseEvent){
            const nodeName = (event.target as Node).nodeName;
            if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
                event.preventDefault();
            if (this.disabled) return;
            if (this.onClick && this.onClick(event) === false) return;
            if (this.autoExecute !== false) {
                let commandName = this.name;
                let commandArgs = [];
                if (this.command) {
                    if (!Array.isArray(this.command)) {
                        commandName = this.command.name;
                        commandArgs = this.command.args;
                    } else {
                        commandArgs = this.command;
                    }
                }
                this.engine?.command.execute(commandName, ...commandArgs);
            }
        }
    }
})
</script>
<style css>
.editor-toolbar .toolbar-button {
    display: inline-block;
    height: 32px;
    width: auto;
    min-width: 32px;
    margin: 0;
    text-align: center;
    padding: 0 7px;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 3px 3px;
    font-size: 16px;
    cursor: pointer;
    color: #595959;
    outline: none;
    line-height: 32px;
}

.editor-toolbar .toolbar-button:hover {
    border: 1px solid transparent;
    background-color: #f5f5f5;
}

.editor-toolbar .toolbar-button:active,.editor-toolbar .toolbar-button-active,.editor-toolbar .toolbar-button-active:hover {
    background-color: #e8e8e8;
    border: 1px solid transparent;
}

.editor-toolbar .toolbar-button-disabled,.editor-toolbar .toolbar-button-disabled:hover {
    background-color: transparent;
    border: 1px solid transparent;
    box-shadow: none;
    color: #000000;
    opacity: 0.25;
    cursor: not-allowed;
}
</style>