<template>
  <div
    class="code-viewer-container"
    :class="[
      themeMode,
      settingCollapsed ? 'setting-collapsed' : ''
    ]"
  >
    <page-header />
    <setting-wrapper
      class="setting-wrapper"
    />

    <div class="code-viewer">
      <button
        class="btn-collapse"
        @click="handleCollapseBtnClick"
      >
        <svg t="1692865604140" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4482" width="32" height="32"><path d="M512 608c-6.4 0-19.2 0-25.6-6.4l-128-128c-12.8-12.8-12.8-32 0-44.8s32-12.8 44.8 0L512 531.2l102.4-102.4c12.8-12.8 32-12.8 44.8 0s12.8 32 0 44.8l-128 128C531.2 608 518.4 608 512 608z" fill="" p-id="4483"></path></svg>
      </button>

      <div ref="containerRef"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, reactive, watch } from 'vue'
import { CodeViewer, type ViewerOptions } from '@humandetail/code-viewer'
import { ThemeMode } from './types'

import PageHeader from './components/header/index.vue'
import SettingWrapper from './components/settings/index.vue'
import { startViewTransition } from './utils'

const themeMode = ref<ThemeMode>('light')
const options = reactive<Required<ViewerOptions>>({
  content: 'Show you your code.',
  language: 'plaintext',
  width: document.documentElement.clientWidth - 32,
  height: document.documentElement.clientHeight / 2,
  themeMode: 'light',
  displayLineNumber: true,
  breakRow: false,
  overflowX: 'scroll',
  overflowY: 'auto',
  headerBarSetting: {
    visible: true,
    collapsible: true,
    displayLanguage: true,
    copyable: true
  },
  isCollapsed: false
})

const settingCollapsed = ref(false)

const containerRef = ref()

const cv = new CodeViewer(options)

onMounted(() => {
  cv.mount(containerRef.value)
  cv.render()
})

let delayRenderTimeoutId: number
watch([options, themeMode], ([newOptions, newThemeMode]) => {
  clearTimeout(delayRenderTimeoutId)

  delayRenderTimeoutId = window.setTimeout(() => {
    try {
      cv.reset({
        ...newOptions,
        themeMode: newThemeMode
      })
    } catch (err) {
      console.error(err)
    }
  }, 500)
})

const handleCollapseBtnClick = () => {
  startViewTransition(() => {
    settingCollapsed.value = !settingCollapsed.value
  })
}

provide('themeMode', themeMode)
provide('options', options)
</script>

<style lang="scss" scoped>
.code-viewer-container {
  .code-viewer {
    position: relative;
    width: 100%;
    padding: 32px 16px 16px;
    box-sizing: border-box;
    overflow-x: auto;

    .btn-collapse {
      all: unset;
      position: absolute;
      left: 50%;
      top: 0;
      width: 32px;
      height: 16px;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      border: 1px solid var(--border-color);
      transform: translateX(-50%);
      cursor: pointer;

      .icon {
        width: 32px;
        height: 32px;
        margin-top: -8px;
        fill: var(--secondary-color);
        transform: rotate(180deg);
      }

      &:hover {
        background-color: var(--brand-color);
        border-color: var(--sub-brand-color);

        .icon {
          fill: #fff;
        }
      }
    }

    &::before {
      content: '';
      position: absolute;
      top: 17px;
      left: 0;
      width: 100%;
      height: 1px;
      background-color: var(--border-color);
    }
  }

  &.setting-collapsed {
    .setting-wrapper {
      height: 0;
      overflow: hidden;
    }

    .code-viewer {
      &::before {
        background-color: transparent;
      }

      .btn-collapse {
        transform: translateX(-50%) rotateX(180deg);
      }
    }
  }
}
</style>
