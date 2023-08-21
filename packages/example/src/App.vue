<template>
  <div>
    <div class="setting">
      <p>
        <label for="J_lang">Language:&emsp;</label>
        <select
          id="J_lang"
          v-model="lang"
        >
          <option
            v-for="lang of languages"
            :key="lang"
          >
            {{ lang }}
          </option>
        </select>
      </p>

      <p for="J_code">Code:</p>
      <textarea v-model="code" style="width: 800px; height: 200px;" @input="onInputDelayRender"></textarea>
    </div>

    <p>Rendered:</p>
    <div ref="containerRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CodeViewer, listLanguages } from '@humandetail/code-viewer'

const languages = listLanguages()
const lang = ref('typescript')
const code = ref(`const a = 1
const b = 2
console.log(a + b) // 3

const helloWorld = (hello: string, world: string): string => hello + ' ' + world + '.'

helloWorld('Hello', 'World') // Hello World

helloWorld('Java', 'Script') // Java Script

console.log('JavaScript')
// JavaScript`)

const containerRef = ref()

const cv = new CodeViewer({
  content: code.value,
  language: lang.value,
  width: 400,
  height: 200,
  breakRow: false,
  overflowX: 'scroll',
  overflowY: 'scroll',
  themeMode: 'light'
}, {
  style: {
    borderRadius: 8
  }
})

onMounted(() => {
  cv.mount(containerRef.value)
  cv.render()
})

let delayRenderTimeoutId: number
const onInputDelayRender = (() => {
  clearTimeout(delayRenderTimeoutId)

  delayRenderTimeoutId = window.setTimeout(() => {
    try {
      cv.update(code.value, lang.value)
    } catch (err) {
      console.error(err)
    }
  }, 500)
})

</script>
