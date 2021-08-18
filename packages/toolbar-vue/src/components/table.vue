<template>
    <div
    data-element="ui"
	class="data-toolbar-table-selector"
	>
        <div class="data-toolbar-table-selector-tr"  v-for="row in currentRows" :key="row">
            <div
            v-for="col in currentCols"
            :class="[{'data-toolbar-table-selector-td': true}, {actived: row - 1 < selectedRows && col - 1 < selectedCols}]"
            :key={col}
            @click="triggerSelect($event,row - 1,col - 1)"
            @mousedown="triggerMouseDown($event)"
            @mouseover="triggerHover(row - 1,col - 1)"
            />
        </div>
        <div class="data-toolbar-table-selector-info">
            {{selectedRows === undefined ? 0 : selectedRows}}x{{selectedCols === undefined ? 0 : selectedCols}}
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'

export default defineComponent({
    name:"am-table",
    props:{
        maxRows: Number,
        maxCols: Number,
        minRows: Number,
        minCols: Number,
        onSelect: Function as PropType<(event: MouseEvent, rows: number, cols: number) => void>
    },
    setup(props){
        const maxRows = ref(props.maxRows || 10);
        const maxCols = ref(props.maxCols || 10);
        const minRows = ref(props.minRows || 4);
        const minCols = ref(props.minCols || 4);
        const currentRows = ref(4);
        const currentCols = ref(4);
        const selectedRows = ref(0);
        const selectedCols = ref(0); 
        
        return {
            maxRows,
            maxCols,
            minRows,
            minCols,
            currentRows,
            currentCols,
            selectedRows,
            selectedCols
        }
    },
    methods:{
        triggerMouseDown(event: MouseEvent){
            event.preventDefault()
        },
        triggerSelect(event:MouseEvent, rows: number, cols: number){
            if(this.onSelect) this.onSelect(event, rows + 1, cols + 1);
        },
        triggerHover(rows: number, cols: number){
            const showRows = Math.max(this.minRows, Math.min(this.maxRows, rows + 2));
            const showCols = Math.max(this.minCols, Math.min(this.maxCols, cols + 2));
            this.currentRows = showRows
            this.currentCols = showCols
            this.selectedRows = rows + 1
            this.selectedCols = cols + 1
        }
    }
})
</script>
<style>
.data-toolbar-table-selector .data-toolbar-table-selector-tr {
    display: flex;
    flex-wrap: nowrap;
}
.data-toolbar-table-selector .data-toolbar-table-selector-tr .data-toolbar-table-selector-td {
    width: 20px;
    height: 16px;
    border: 1px solid #d9d9d9;
    margin-right: -1px;
    margin-bottom: -1px;
    cursor: pointer;
}
.data-toolbar-table-selector .data-toolbar-table-selector-tr .data-toolbar-table-selector-td.actived {
    background: #ddefff;
}
.data-toolbar-table-selector .data-toolbar-table-selector-info {
    text-align: center;
}
</style>