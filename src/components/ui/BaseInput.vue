<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-medium text-[var(--text-secondary)]">
      {{ label }}
      <span v-if="required" class="text-cta">*</span>
    </label>
    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="[
        'px-3.5 py-2.5 rounded-[var(--radius-md)] font-rubik text-sm',
        'bg-surface-1 text-white placeholder:text-[var(--text-muted)]',
        'transition-all duration-normal ease-smooth',
        'focus:outline-none focus:ring-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border border-cta focus:ring-cta/30 focus:border-cta'
          : 'border border-[var(--border-subtle)] focus:ring-primary/30 focus:border-primary',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />
    <p v-if="error" class="text-xs text-cta">
      {{ error }}
    </p>
    <p v-if="hint && !error" class="text-xs text-[var(--text-muted)]">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string | number]
  blur: []
  focus: []
}>()

const id = computed(() => Math.random().toString(36).substr(2, 9))
</script>
