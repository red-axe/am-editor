<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <EngineDemo />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import EngineDemo from '@/components/EngineDemo.vue'; // @ is an alias to /src

@Options({
  components: {
    EngineDemo,
  },
})
export default class Home extends Vue {}
</script>
