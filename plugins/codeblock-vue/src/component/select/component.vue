<template>
    <a-select
    :show-search="true"
    size="small"
    :bordered="false"
    style="min-width: 128px"
    :default-value="defaultValue"
    :get-popup-container="getContainer"
    @select="onSelect"
    :filter-option="filter"
    >
        <a-select-option
        v-for="item in modeDatas"
        :name="item.name"
        :value="item.value"
        :key="item.value"
        >
            {{item.name}}
        </a-select-option>
    </a-select>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import ASelect from 'ant-design-vue/es/select'
import 'ant-design-vue/es/select/style'
const ASelectOption = ASelect.Option

export default defineComponent({
    name:"am-codeblock-select",
    components:{
        ASelect,
        ASelectOption
    },
    props:{
        modeDatas: Array as PropType<Array<{value: string, syntax: string, name: string,}>>,
        defaultValue:String,
        getContainer:Function,
        onSelect:Function
    },
    methods:{
        filter(input: string, option: any){
            input = input.toLowerCase();
            const key = option.key || '';
            let name = option.name || '';
            name = name.toLowerCase();
            return key.includes(input) || name.includes(input);
        }
    }
})
</script>