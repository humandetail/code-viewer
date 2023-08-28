<template>
  <div
    class="the-select"
    :class="{ focus }"
  >
    <select
      class="select"
      :value="currentValue"
      @focus="focus = true"
      @blur="focus = false"
      @change="handleChange"
    >
      <option
        v-for="option of localOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <span class="select-icon">
      <svg t="1692865604140" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4482" width="32" height="32"><path d="M512 608c-6.4 0-19.2 0-25.6-6.4l-128-128c-12.8-12.8-12.8-32 0-44.8s32-12.8 44.8 0L512 531.2l102.4-102.4c12.8-12.8 32-12.8 44.8 0s12.8 32 0 44.8l-128 128C531.2 608 518.4 608 512 608z" fill="" p-id="4483"></path></svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  value?: any
  options?: { label: string, value: any }[]
}>()

const emits = defineEmits<{ (e: 'change', val: any): void }>()

const currentValue = ref(props.value)
const localOptions = ref(props.options ?? [])
const focus = ref(false)

const handleChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const val = target.value

  currentValue.value = val

  emits('change', val)
}
</script>

<style lang="scss" scoped>
.the-select {
  position: relative;
  cursor: pointer;

  .select {
    all: unset;
    min-width: 180px;
    width: max-content;
    height: 28px;
    line-height: 28px;
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

  .select-icon {
    position: absolute;
    right: 0;
    top: 0;
    width: 28px;
    height: 28px;
    transition: .1s linear;

    .icon {
      width: 100%;
      height: 100%;
      fill: var(--border-color);
    }
  }

  &.focus {
    .select-icon {
      transform: rotate(180deg);
    }
  }
}
</style>
