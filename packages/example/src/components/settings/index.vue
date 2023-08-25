<template>
  <section
    class="settings"
    :class="{ collapsed }"
  >
    <div class="wrapper options-wrapper">
      <h2 class="title">Options</h2>
      <options-setting />
    </div>

    <div class="wrapper content-wrapper">
      <h2 class="title">Content</h2>
      <textarea v-model="options.content" class="content-input"></textarea>
      <button
        class="btn-collapse"
        @click="handleCollapseBtnClick"
      >
        <svg t="1692865604140" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4482" width="32" height="32"><path d="M512 608c-6.4 0-19.2 0-25.6-6.4l-128-128c-12.8-12.8-12.8-32 0-44.8s32-12.8 44.8 0L512 531.2l102.4-102.4c12.8-12.8 32-12.8 44.8 0s12.8 32 0 44.8l-128 128C531.2 608 518.4 608 512 608z" fill="" p-id="4483"></path></svg>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import OptionsSetting from './Options.vue'
import { startViewTransition } from '../../utils'
import { ViewerOptions } from '@humandetail/code-viewer'

const collapsed = ref(false)
const options = inject('options', ref<ViewerOptions>({}))

const handleCollapseBtnClick = () => {
  startViewTransition(() => {
    collapsed.value = !collapsed.value
  })
}
</script>

<style lang="scss" scoped>
.settings {
  display: flex;

  .wrapper {
    padding: 16px;

    .title {
      position: relative;
      padding-left: 16px;
      line-height: 32px;
      font-size: 18px;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        width: 6px;
        height: 6px;
        border-radius: 2px;
        border: 1px solid var(--brand-color);
        transform: translateY(-50%) rotate(45deg);
      }

      &:hover {
        &::before {
          background-color: var(--brand-color);
        }
      }
    }

    &.options-wrapper {
      width: calc(50% - 16px);
    }

    &.content-wrapper {
      flex: 1;
      position: relative;
      padding-left: 32px;

      .btn-collapse {
        all: unset;
        position: absolute;
        left: 0;
        top: 50%;
        width: 16px;
        height: 32px;
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        border: 1px solid var(--border-color);
        transform: translateY(-50%);
        cursor: pointer;

        .icon {
          width: 32px;
          height: 32px;
          margin-left: -8px;
          fill: var(--secondary-color);
          transform: rotate(90deg);
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
        left: 17px;
        top: 0;
        width: 1px;
        height: 100%;
        background-color: var(--border-color);
      }

      .content-input {
        all: unset;
        width: 100%;
        height: calc(100% - 16px);
        min-height: 120px;
        line-height: 1.6;
        padding: 16px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--white);
        box-sizing: border-box;
        resize: none;

        &:focus {
          outline: 1px solid var(--brand-color);
        }

        &:focus,
        &:hover {
          border-color: var(--sub-brand-color);
        }
      }
    }
  }

  &.collapsed {
    .options-wrapper {
      width: 0;
      padding: 0;
      overflow: hidden;
    }

    .content-wrapper {
      &::before {
        background-color: transparent;
      }

      .btn-collapse {
        transform: translateY(-50%) rotateY(180deg);
      }
    }
  }
}
</style>
