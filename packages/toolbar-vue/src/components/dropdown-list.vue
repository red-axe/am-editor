<template>
    <div
    :class="['toolbar-dropdown-list',`toolbar-dropdown-${direction || 'vertical'}`,{'toolbar-dropdown-dot': hasDot !== false},className]"
    >
        <a-tooltip v-for="{ key , placement , title , direction , hasDot , content , className , icon, disabled } in items" :key="key" :placement="placement || 'right'" 
        :overlayStyle="(!!title || !!hotkeys[key]) && !isMobile ? {} : {display:'none'}"
        >
            <template #title>
                <div v-if="!!title" class="toolbar-tooltip-title">{{title}}</div>
                <div v-if="!!hotkeys[key]" class="toolbar-tooltip-hotkey" v-html="hotkeys[key]"></div>
            </template>
            <a 
            :class="['toolbar-dropdown-list-item',className, {'toolbar-dropdown-list-item-disabled': disabled}]"
            @click="triggerSelect($event,key)">
                <span v-if="((typeof values === 'string' && values === key) || (Array.isArray(values) && values.indexOf(key) > -1)) &&
					direction !== 'horizontal' &&
					hasDot !== false" class="data-icon data-icon-dot"></span>
                <slot name="icon"><span v-if="icon" :class="['data-icon',`data-icon-${icon}`]" /></slot>
                <div v-html="typeof content === 'function' ? content() : content"></div>
            </a>
        </a-tooltip>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import ATooltip from "ant-design-vue/es/tooltip"
import { formatHotkey, isMobile } from '@aomao/engine'
import { dropdownListProps , DropdownListItem } from '../types'
import { autoGetHotkey } from "../utils"
import 'ant-design-vue/es/tooltip/style'

export default defineComponent({
    name:"am-dropdown-list",
    components:{
        ATooltip
    },
    props:dropdownListProps,
    setup(props){
        const getHotkey = (item:DropdownListItem) => {
            const { command, key } = item
            let { hotkey } = item
            //默认获取插件的热键
            if (props.engine && (hotkey === true || hotkey === undefined)) {
                hotkey = autoGetHotkey(
                    props.engine,
                    command && !Array.isArray(command) ? command.name : props.name,
                    key
                );
            }
            if (typeof hotkey === 'string' && hotkey !== '') {
                hotkey = formatHotkey(hotkey)
            }
            return hotkey
        }

        const hotkeys:{[key: string]: any} = {}
        props.items.forEach(item => {
            hotkeys[item.key] = getHotkey(item)
        })
        return {
            isMobile,
            hotkeys
        }
    },
    methods:{
        triggerSelect(event:MouseEvent,key:string){
            event.preventDefault();
            event.stopPropagation();
            const item = this.items.find(item => item.key === key);
            if (!item || item.disabled) return;
            const { autoExecute, command } = item;
            if (this.onSelect && this.onSelect(event, key) === false) return;
            if (autoExecute !== false) {
                let commandName = this.name;
                let commandArgs = [key];
                if (command) {
                    if (!Array.isArray(command)) {
                        commandName = command.name;
                        commandArgs = commandArgs.concat(command.args);
                    } else {
                        commandArgs = commandArgs.concat(command);
                    }
                }
                this.engine?.command.execute(commandName, ...commandArgs);
            }
        }
    }
})
</script>