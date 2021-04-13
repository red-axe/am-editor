<template>
  <div ref="container" />
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import Bold from "@aomao/plugin-bold"
import Engine from "@aomao/engine"

export default class EngineDemo extends Vue {

    mounted(){
        const container:HTMLElement | null = this.$refs.container as HTMLElement
        if(container){
            //实例化引擎
            const engine = new Engine(container,{
                plugins:[Bold]
            });
            engine.setValue("<strong>我在这里哟～</strong>")
        }
    }
}
</script>
