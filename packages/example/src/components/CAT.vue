<template>
  <div v-if="!isComplete" class="cat-container">
    <div
      v-if="entryVisible"
      class="entry-wrapper"
    >
      <button class="btn-start" @click="handleStartBtnClick">Get start</button>
    </div>

    <div
      v-else
      class="cat-wrapper"
    >
      <div class="cat-logo-mask"></div>
      <div class="cat-mask"></div>
      <div class="cat-logo"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isComplete = ref(false)
const entryVisible = ref(true)

const handleStartBtnClick = () => {
  entryVisible.value = !entryVisible.value

  setTimeout(() => {
    isComplete.value = true
  }, 2100)
}

</script>

<style lang="scss" scoped>
.cat-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .entry-wrapper {
    position: absolute;
    width: 100vw;
    height: 100vh;
    background: url(https://humandetail.github.io/code-viewer/code-viewer.svg) no-repeat center center,
      linear-gradient(-75deg, #715633, #2b2522);

    .btn-start {
      all: unset;
      position: absolute;
      left: 50%;
      bottom: 10%;
      padding: 8px 36px;
      border-radius: 4px;
      color: #333;
      background-color: #fff;
      transform: translateX(-50%);
      cursor: pointer;

      &:hover {
        color: #fff;
        background-color: #FFC988;
      }
    }
  }
}
.cat-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  animation: 1.5s ease 0.1s forwards scale;
}
.cat-logo-mask {
  position: absolute;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  background: linear-gradient(-75deg, #715633, #2b2522);
  -webkit-mask: url(https://humandetail.github.io/code-viewer/code-viewer.svg), linear-gradient(#fff, #fff);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center center;
  -webkit-mask-composite: xor;
  animation: 1.5s ease 0.6s forwards changeOpacity;
}
.cat-mask {
  position: absolute;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(-75deg, #715633, #2b2522);
  z-index: 2;
  animation: 2s ease 0.1s forwards changeOpacity;
}
.cat-logo {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100vw;
  height: 100vh;
  background: url(https://humandetail.github.io/code-viewer/code-viewer.svg) no-repeat center center;
  animation: 2s ease 1ms forwards changeOpacity;
}
@keyframes changeOpacity {
  0%,
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes scale {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(5);
  }
}
</style>
