<template>
    <div class="toolbar-collapse-group">
        <div v-if="title" class="toolbar-collapse-group-title">{{title}}</div>
        <am-collapse-item 
        v-for="item in items"
        :key="item.name"
        :engine="engine"
        v-bind="{...omit(item, 'onClick')}"
        :on-click="onClick"
        />
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { omit } from 'lodash';
import { collapseGroupProps } from '../../types'
import AmCollapseItem from './item.vue'

export default defineComponent({
    name:"am-collapse-group",
    components:{
        AmCollapseItem
    },
    props:collapseGroupProps,
    setup(props){
        const onClick = (event:MouseEvent, name:string) => {
            let result;
            const item = props.items.find(item => item.name === name)
            if (item?.onClick)
                result = item.onClick(event, name);
            if (props.onSelect) props.onSelect(event, name);
            return result;
        }
        return {
            omit,
            onClick
        }
    }
})
</script>