<template>
  <div
    class="the-switch"
    :class="{ checked }"
    role="input"
    @click="handleClick"
  >
    <span class="check"></span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  value?: boolean
}>()

const emits = defineEmits<{ (e: 'change', val: boolean): void }>()

const checked = ref(!!props.value)

const handleClick = () => {
  checked.value = !checked.value

  emits('change', checked.value)
}
</script>

<style lang="scss" scoped>
.the-switch {
  width: 40px;
  height: 20px;
  padding: 2px;
  border-radius: 10px;
  background-color: var(--switch);
  box-sizing: border-box;
  cursor: pointer;

  .check {
    display: block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #fff;
    transition: .1s linear;
  }

  &.checked {
    background-color: var(--brand-color);

    .check {
      transform: translateX(20px);
    }
  }
}
</style>
