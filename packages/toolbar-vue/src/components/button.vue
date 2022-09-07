<template>
    <a-tooltip :placement="placement || 'bottom'" :visible="(!!title || !!hotkeyText) && !isMobile ? visible : false">
        <template #title>
            <div v-if="!!title" class="toolbar-tooltip-title">{{title}}</div>
            <div v-if="!!hotkeyText" class="toolbar-tooltip-hotkey" v-html="hotkeyText"></div>
        </template>
        <button
        :class="['toolbar-button',className,{'toolbar-button-active': active,'toolbar-button-disabled':disabled}]"
        ref="element"
        @click="triggerClick"
        @mousedown="triggerMouseDown"
        @mouseenter="triggerMouseEnter"
        @mouseleave="triggerMouseLeave">
            <slot name="icon">
                <span v-if="iconIsHtml" v-html="icon"></span>
                <span v-if="!iconIsHtml && icon" :class="`data-icon data-icon-${icon}`" />
            </slot>
            <slot>{{typeof content === 'function' ? content(engine) : content}}</slot>
        </button>
    </a-tooltip>
</template>
<script lang="ts">
import { defineComponent, ref} from "vue"
import ATooltip from "ant-design-vue/es/tooltip"
import { formatHotkey, isMobile } from '@aomao/engine'
import { autoGetHotkey } from "../utils"
import { buttonProps } from "../types"
import 'ant-design-vue/es/tooltip/style'

export default defineComponent({
    name:"am-button",
    components:{
        ATooltip
    },
    props:buttonProps,
    setup(props){
        const element = ref<HTMLButtonElement | undefined>()
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
            iconIsHtml:/^<.*>/.test((props.icon || "").trim()),
            isMobile,
            visible,
            hotkeyText:hotkey,
            element
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
            if (this.onMouseDown) this.onMouseDown(event, this.engine);
            this.visible = false
        },
        triggerMouseEnter(event:MouseEvent){
            if(this.onMouseEnter) this.onMouseEnter(event, this.engine)
            this.visible = true
        },
        triggerMouseLeave(event:MouseEvent){
            if(this.onMouseLevel) this.onMouseLevel(event, this.engine)
            this.visible = false
        },
        triggerClick(event: MouseEvent){
            const nodeName = (event.target as Node).nodeName;
            if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
                event.preventDefault();
            if (this.disabled) return;
            if (this.onClick && this.onClick(event, this.engine) === false) return;
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
				if(this.engine)
                this.engine.command.execute(commandName, ...commandArgs);
            }
        }
    }
})
</script>
<style css>
.editor-toolbar .toolbar-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: auto;
    min-width: 26px;
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
}

.editor-toolbar.editor-toolbar-popup .toolbar-button {
    min-width: 24px;
    line-height: 24px;
    border-radius: 4px;
}

.editor-toolbar:not(.editor-toolbar-mobile) .toolbar-button {
    padding: 0 4px;
    margin: 0 1px;
}

.editor-toolbar:not(.editor-toolbar-mobile) .toolbar-button:hover {
    border: 1px solid transparent;
    background-color: #f5f5f5;
}

.editor-toolbar:not(.editor-toolbar-mobile) .toolbar-button:active,.editor-toolbar .toolbar-button-active,.editor-toolbar:not(.editor-toolbar-mobile) .toolbar-button-active:hover {
    background-color: #e8e8e8;
    border: 1px solid transparent;
}

.editor-toolbar .toolbar-button-disabled,.editor-toolbar:not(.editor-toolbar-mobile) .toolbar-button-disabled:hover {
    background-color: transparent;
    border: 1px solid transparent;
    box-shadow: none;
    color: #000000;
    opacity: 0.25;
    cursor: not-allowed;
}
</style>
