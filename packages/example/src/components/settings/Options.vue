<template>
  <aside class="options">
    <p
      v-for="field of fields"
      :key="field.name"
      class="field"
    >
      <span class="label">
        {{ field.label }}:
      </span>
      <span class="value">
        <input-number
          v-if="field.type === 'number'"
          :value="getFieldValue<number>(field.name)"
          @change="val => handleChange(val, field.name)"
        />

        <the-switch
          v-else-if="field.type === 'switch'"
          :value="getFieldValue<boolean>(field.name)"
          @change="val => handleChange(val, field.name)"
        />

        <the-select
          v-else-if="field.type === 'select'"
          :value="getFieldValue<any>(field.name)"
          :options="field.options"
          @change="val => handleChange(val, field.name)"
        />
      </span>
    </p>
  </aside>
</template>

<script setup lang="ts">
import { inject, reactive } from 'vue'
import { ViewerOptions, listLanguages } from '@humandetail/code-viewer'

import InputNumber from '../form/InputNumber.vue'
import TheSwitch from '../form/TheSwitch.vue'
import TheSelect from '../form/TheSelect.vue'

type FieldName = keyof ViewerOptions | 'headerBarVisible' | 'collapsible' | 'displayLanguage' | 'copyable'

interface Field {
   name: FieldName,
   label: string,
   type: string,
   options?: { label: string, value: any }[]
}

const options = inject('options', reactive<ViewerOptions>({}))

const overflowOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Scroll', value: 'scroll' },
  { label: 'Hidden', value: 'hidden' },
]

const fields: Field[] = [
  {
    name: 'language',
    label: 'Language',
    type: 'select',
    options: listLanguages().map(lang => ({
      label: lang,
      value: lang
    }))
  },
  {
    name: 'width',
    label: 'Width',
    type: 'number'
  },
  {
    name: 'height',
    label: 'Height',
    type: 'number'
  },
  {
    name: 'displayLineNumber',
    label: 'Display line number',
    type: 'switch',
  },
  {
    name: 'breakRow',
    label: 'Break Row',
    type: 'switch'
  },
  {
    name: 'overflowX',
    label: 'Overflow X',
    type: 'select',
    options: overflowOptions
  },
  {
    name: 'overflowY',
    label: 'Overflow Y',
    type: 'select',
    options: overflowOptions
  },
  {
    name: 'headerBarVisible',
    label: 'Header bar visible',
    type: 'switch'
  },
  {
    name: 'collapsible',
    label: 'Collapsible',
    type: 'switch'
  },
  {
    name: 'displayLanguage',
    label: 'Display Language',
    type: 'switch'
  },
  {
    name: 'copyable',
    label: 'Copyable',
    type: 'switch'
  }
]

const getFieldValue = <T>(name: FieldName): T => {
  if (name === 'headerBarVisible') {
    return !!options.headerBarSetting?.visible as T
  }
  if (['collapsible', 'displayLanguage', 'copyable'].includes(name)) {
    return options.headerBarSetting?.[name as Exclude<keyof ViewerOptions['headerBarSetting'], 'visible'>] as T
  }
  return options[name as keyof ViewerOptions] as T

}

const handleChange = (val: any, name: FieldName) => {
  if (name === 'headerBarVisible') {
    options.headerBarSetting = {
      ...options.headerBarSetting,
      visible: val
    }
  } else if (['collapsible', 'displayLanguage', 'copyable'].includes(name)) {
    options.headerBarSetting = {
      ...options.headerBarSetting,
      visible: !!options.headerBarSetting?.visible,
      [name as Exclude<keyof ViewerOptions['headerBarSetting'], 'visible'>]: val
    }
  } else {
    options[name as keyof ViewerOptions] = val
  }
}
</script>

<style lang="scss" scoped>
.options {
  .field {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      width: 180px;
      text-align: right;
    }

    & + .field {
      margin-top: 16px;
    }
  }
}
</style>
