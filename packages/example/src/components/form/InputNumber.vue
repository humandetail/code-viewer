<template>
  <div
    role="input"
    class="input-number"
  >
    <input
      class="input"
      :value="currentValue ?? ''"
      @blur="handleBlur"
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  value?: number
}>()

const currentValue = ref(props.value)

const emits = defineEmits<{ (e: 'change', val?: number): void }>()

const handleBlur = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val: number | undefined = Number(target.value)

  if (Number.isNaN(val)) {
    val = undefined
  }

  currentValue.value = val

  emits('change', val)
}
</script>

<style lang="scss" scoped>
.input-number {
  .input {
    all: unset;
    min-width: 180px;
    width: fit-content;
    height: 28px;
    padding: 0 8px;
    border-radius: 4px;
    background-color: var(--input);
    box-sizing: border-box;
    font-size: 14px;

    &:focus {
      background-color: var(--white);
      outline: 1px solid var(--brand-color);
    }

    &:focus,
    &:hover {
      border-color: var(--sub-brand-color);
    }
  }
}
</style>
