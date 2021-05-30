<template>
    <div
    :class="['toolbar-dropdown-list',`toolbar-dropdown-${direction || 'vertical'}`,{'toolbar-dropdown-dot': hasDot !== false},className]"
    >
        <a-tooltip v-for="{ key , placement , title , hotkey , direction , hasDot , content , className , icon } in items" :key="key" :placement="placement || 'right'" 
        :overlayStyle="!!title || !!hotkey ? {} : {display:'none'}"
        >
            <template #title>
                <div v-if="!!title" class="toolbar-tooltip-title">{{title}}</div>
                <div v-if="!!hotkey" class="toolbar-tooltip-hotkey" v-html="hotkey"></div>
            </template>
            <a 
            :class="['toolbar-dropdown-list-item',className]" 
            @click="triggerSelect($event,key)">
                <span v-if="((typeof values === 'string' && values === key) || (Array.isArray(values) && values.indexOf(key) > -1)) &&
					direction !== 'horizontal' &&
					hasDot !== false" class="data-icon data-icon-dot"></span>
                <slot name="icon"><span v-if="icon" :class="['data-icon',`data-icon-${icon}`]" /></slot>
                <slot>{{typeof content === 'function' ? content() : content}}</slot>
            </a>
        </a-tooltip>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import ATooltip from "ant-design-vue/es/tooltip"
import { formatHotkey } from '@aomao/engine'
import { dropdownListProps , DropdownListItem } from '../types'
import { autoGetHotkey } from "../utils"
import 'ant-design-vue/es/tooltip/style/css'

export default defineComponent({
    name:"am-dropdown-list",
    components:{
        ATooltip
    },
    props:dropdownListProps,
    setup(props){
        const getHotkey = (item:DropdownListItem) => {
            const { command } = item
            let { hotkey } = item
            //默认获取插件的热键
            if (props.engine && (hotkey === true || hotkey === undefined)) {
                hotkey = autoGetHotkey(
                    props.engine,
                    command && !Array.isArray(command) ? command.name : props.name,
                );
            }
            if (typeof hotkey === 'string' && hotkey !== '') {
                hotkey = formatHotkey(hotkey)
            }
            return hotkey
        }

        const hotkeys = props.items.map(item => {
            return {[item.key]:getHotkey(item)}
        })

        return {
            hotkeys
        }
    },
    methods:{
        triggerSelect(event:MouseEvent,key:string){
            event.preventDefault();
            event.stopPropagation();
            const item = this.items.find(item => item.key === key);
            if (!item) return;
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