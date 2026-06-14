<template>
  <label class="agreement">
    <input
      v-model="model"
      type="checkbox"
      class="checkbox"
      :required="required"
      :disabled="disabled"
    />
    <div class="text">
      <template v-if="required"> <FormRequired />&nbsp; </template>
      <slot />
    </div>
  </label>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FormRequired from '@/components/form/Required.vue'
interface Props {
  modelValue?: boolean
  name: string
  disabled?: boolean
  required?: boolean
}

const emit = defineEmits(['update:modelValue'])
const props = defineProps<Props>()
const model = ref(props.modelValue)

watch(
  () => model.value,
  value => {
    emit('update:modelValue', value)
  },
)
</script>

<style lang="postcss" scoped>
.agreement {
  display: grid;
  grid-template-columns: 3rem 1fr;
  column-gap: var(--size-gap-20);
  padding-bottom: var(--size-gap-20);
  cursor: pointer;

  .checkbox {
    grid-row: 1;
    grid-column: 1;
  }

  .text {
    grid-row: 1;
    grid-column: 2;
  }
}
</style>
