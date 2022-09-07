<template>
    <div class="toolbar-collapse-group">
        <div v-if="title" class="toolbar-collapse-group-title">{{title}}</div>
        <am-collapse-item
        v-for="item in items"
        :key="item.name"
        :engine="engine"
        v-bind="{...omit(item, 'onClick', 'onDisabled')}"
        :on-click="onClick"
        />
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { EngineInterface } from '@aomao/engine';
import omit from 'lodash/omit';
import { collapseGroupProps } from '../../types'
import AmCollapseItem from './item.vue'

export default defineComponent({
    name:"am-collapse-group",
    components:{
        AmCollapseItem
    },
    props:collapseGroupProps,
    setup(props){
        const onClick = (event:MouseEvent, name:string, engine?: EngineInterface) => {
            let result;
            const item = props.items.find(item => item.name === name)
            if (item && item.onClick)
                result = item.onClick(event, name, engine);
            if (props.onSelect) props.onSelect(event, name, engine);
            return result;
        }
        return {
            omit,
            onClick
        }
    }
})
</script>
