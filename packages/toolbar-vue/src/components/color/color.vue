<template>
    <div :class="['toolbar-dropdown','colorpicker-button', {'toolbar-dropdown-right': isRight}]" ref="buttonRef">
        <div
        :class="['toolbar-dropdown-trigger colorpicker-button-group',
            { 'colorpicker-button-group-active': visible },
        ]"
        >
            <am-button
            class="colorpicker-button-text"
            :name="name"
            :title="buttonTitle"
            :on-click="triggerClick"
            :disabled="disabled"
            >
                <span v-html="buttonContent"></span>
            </am-button>
            <am-button
            class="colorpicker-button-dropdown toolbar-dropdown-trigger-arrow"
            :name="name"
            :title="dropdownTitle"
            :on-click="toggleDropdown"
            :disabled="disabled"
            >
                <template #icon>
                    <span className="colorpicker-button-dropdown-empty" />
                </template>
                <span className="data-icon data-icon-arrow" />
            </am-button>
        </div>
        <div v-if="visible" class="toolbar-dropdown-list" data-element="ui">
            <am-color-picker
            :engine="engine"
            :colors="colors"
            :default-active-color="currentColor"
            :default-color="defaultColor"
            :on-select="triggerSelect"
            :set-stroke="setStroke"
            />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, onUnmounted, ref, watch } from 'vue'
import { colorProps } from '../../types'
import { useRight } from '../../hooks';
import AmButton from '../button.vue'
import AmColorPicker from './picker/picker.vue'
import Palette from './picker/palette';

export default defineComponent({
    name:"am-color",
    components:{
        AmButton,
        AmColorPicker
    },
    props:colorProps,
    setup(props){
        const visible = ref(false)
        const getContent = () => {
            return typeof props.content === 'string'
                ? props.content
                : props.content(
                        props.defaultActiveColor,
                        Palette.getStroke(props.defaultActiveColor),
                        props.disabled,
                )
        }
        const buttonContent = ref(getContent())

        const buttonRef = ref<HTMLDivElement | null>(null)
        const isRight = useRight(buttonRef)
  
        const currentColor = ref(props.defaultActiveColor);

        const toggleDropdown = (event: MouseEvent) => {
            event.preventDefault();

            if (visible.value) {
                hideDropdown();
            } else {
                showDropdown();
            }
        };

        const showDropdown = () => {
            setTimeout(() => {
              document.addEventListener('click', hideDropdown);
            }, 10);
            visible.value = true
        };

        const hideDropdown = (event?: MouseEvent) => {
            if (event && (event.target as Element).closest('.toolbar-dropdown-list'))
                return;
            document.removeEventListener('click', hideDropdown);
            visible.value = false
        };

        const triggerClick = (event:MouseEvent) => {
            triggerSelect(currentColor.value,event)
        }

        const triggerSelect = (color: string, event: MouseEvent) => {
            currentColor.value = color;
            buttonContent.value = typeof props.content === 'string'
                    ? props.content
                    : props.content(color, Palette.getStroke(color), props.disabled)

            if (props.autoExecute !== false) {
                let commandName = props.name;
                let commandArgs = [color, props.defaultColor];
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
            if (props.onSelect) props.onSelect(color, event);
        };

        onUnmounted(() => document.removeEventListener('click', hideDropdown))

        watch(() => props.disabled, () => buttonContent.value = getContent())

        return {
            buttonRef,
            isRight,
            visible,
            buttonContent,
            currentColor,
            triggerSelect,
            triggerClick,
            toggleDropdown
        }
    }
})
</script>
<style>
.editor-toolbar .colorpicker-button .colorpicker-button-group {
    padding: 0 2px;
}

.colorpicker-button-group .toolbar-button {
    padding: 0;
}

.colorpicker-button-group .colorpicker-button-text {
    height: 32px;
    margin-right: 0;
    min-width: 26px;
    border-radius: 3px 0 0 3px;
}

.colorpicker-button-group .colorpicker-button-text:active {
    background-color: #e8e8e8;
}

.colorpicker-button-group .colorpicker-button-dropdown {
    height: 32px;
    margin-left: -1px;
    min-width: 17px;
    text-align: center;
    padding: 0 0;
    border-radius: 0 3px 3px 0;
}
  
.colorpicker-button-group .colorpicker-button-dropdown:hover,
.colorpicker-button-group .colorpicker-button-dropdown:active {
    background-color: #e8e8e8;
}

.colorpicker-button-group .colorpicker-button-dropdown .colorpicker-button-dropdown-empty {
    display: inline-block;
}

.colorpicker-button-group:hover .toolbar-button {
    border: 1px solid #e8e8e8;
}
.colorpicker-button-group-active .toolbar-button,
.colorpicker-button-group-active:hover .toolbar-button {
    border: 1px solid #e8e8e8;
}
</style>