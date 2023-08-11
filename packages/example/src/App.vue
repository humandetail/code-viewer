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
      <p>
        <label for="J_code">Code:&emsp;</label>
        <textarea v-model="code" style="width: 800px; height: 200px;"></textarea>
      </p>

      <p>
        <button @click="handleBtnClick">Render</button>
      </p>
    </div>
    <div ref="containerRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CodeViewer, githubThemes, listLanguages } from '@humandetail/code-viewer'

const languages = listLanguages()
const lang = ref('javascript')
const code = ref('hello world')

const containerRef = ref()

const cv = new CodeViewer({
  content: code.value,
  language: lang.value,
  style: {
    fontSize: 12,
    lineHeight: 18
  },
  width: 800,
  height: 600,
  breakRow: false,
  overflowX: 'scroll',
  overflowY: 'auto'
})

cv.setThemes(githubThemes)

onMounted(() => {
  cv.mount(containerRef.value)
  cv.render()
})

const handleBtnClick = () => {
  cv.update(code.value, lang.value)
}

</script>
