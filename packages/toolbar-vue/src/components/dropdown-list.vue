<template>
    <div
	ref="element"
    :class="['toolbar-dropdown-list',`toolbar-dropdown-${direction || 'vertical'}`,{[`toolbar-dropdown-placement-${placement}`]: !!placement },{'toolbar-dropdown-dot': hasDot !== false},className]"
    >
        <a-tooltip v-for="{ key , placement , title, content , className , icon, disabled } in items" :key="key" :placement="placement || 'right'"
        >
            <template #title v-if="(!!title || !!hotkeys[key]) && !isMobile">
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
                <div v-html="typeof content === 'function' ? content(engine) : content"></div>
            </a>
        </a-tooltip>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
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
		const placement = ref<string>('')
		const element = ref<HTMLElement | null>(null)
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


		onMounted(() => {
			if (element.value && props.engine && props.engine.scrollNode) {
				const ev = element.value
				const scrollElement = props.engine.scrollNode.get<HTMLElement>();
				if (!scrollElement) return;
				const rect = ev.getBoundingClientRect();
				const scrollRect = scrollElement.getBoundingClientRect();
				if (rect.top < scrollRect.top) placement.value = 'bottom';
				if (rect.bottom > scrollRect.bottom) placement.value = 'top'
			}
		})

        return {
			element,
            isMobile,
            hotkeys,
			placement
        }
    },
    methods:{
        triggerSelect(event:MouseEvent,key:string){
            event.preventDefault();
            event.stopPropagation();
            const item = this.items.find(item => item.key === key);
            if (!item || item.disabled) return;
            const { autoExecute, command } = item;
            if (this.onSelect && this.onSelect(event, key, this.engine) === false) return;
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
				if(this.engine)
                this.engine.command.execute(commandName, ...commandArgs);
            }
        }
    }
})
</script>
