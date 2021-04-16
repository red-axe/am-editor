<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </div>
  <router-view/>
</template>

<style lang="less">
#app{
    padding-top: 42px;
}
#nav {
    padding: 10px;
    position: fixed;
    top: 0;
    width: 100%;
    background: #fff;
    z-index: 999;
  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
