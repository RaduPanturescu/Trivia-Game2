<script setup lang="ts">
/**
 * Exercise name input with a suggestion list. Ported from the legacy `initializeExerciseSuggestions`: the list opens on
 * focus and typing, arrow keys move the highlight, Enter or a click picks a name, Escape and blur close it. Picking a
 * name fires `change`, as the legacy code did, so the parent can react.
 */
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { filterExerciseNames } from './coverage'
import { useExerciseLibrary } from './useExerciseLibrary'

const props = defineProps<{
  /** Typed name. */
  modelValue: string
  /** Id of the input. */
  inputId: string
  /** Id of the suggestion list. Option ids are derived from it. */
  listId: string
  /** Placeholder text. */
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** A name was picked, or the input changed and lost focus. */
  change: []
  /** Enter was pressed and no suggestion was highlighted. The parent may call `preventDefault`. */
  enter: [event: KeyboardEvent]
}>()

const { names } = useExerciseLibrary()
const input = useTemplateRef<HTMLInputElement>('input')
const list = useTemplateRef<HTMLElement>('list')
const open = ref(false)
const active = ref(-1)
const matches = computed(() => filterExerciseNames(names.value, props.modelValue))
const visible = computed(() => open.value && matches.value.length > 0)
const activeId = computed(() => (visible.value && active.value >= 0 ? `${props.listId}-option-${active.value}` : undefined))

/** Opens the list and clears the highlight. */
function openList(): void {
  open.value = true
  active.value = -1
}

/** Closes the list and clears the highlight. */
function close(): void {
  open.value = false
  active.value = -1
}

/**
 * Picks a name: fills the input, closes the list, keeps focus and fires `change`.
 * @param name - The chosen name.
 */
function choose(name: string): void {
  emit('update:modelValue', name)
  close()
  input.value?.focus()
  emit('change')
}

/**
 * Forwards typed text and reopens the list.
 * @param event - The input event.
 */
function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
  openList()
}

/**
 * Moves the highlight and scrolls it into view.
 * @param delta - `1` for down, `-1` for up.
 */
function moveActive(delta: number): void {
  if (!matches.value.length) return
  active.value = Math.max(0, Math.min(matches.value.length - 1, active.value + delta))
  void nextTick(() => list.value?.children[active.value]?.scrollIntoView?.({ block: 'nearest' }))
}

/**
 * Keyboard handling for the combobox. Enter picks the highlighted name, otherwise it is passed to the parent.
 * @param event - The keydown event.
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close()
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!visible.value) openList()
    moveActive(event.key === 'ArrowDown' ? 1 : -1)
    return
  }
  if (event.key === 'Enter') {
    const picked = visible.value && active.value >= 0 ? matches.value[active.value] : undefined
    if (picked !== undefined) {
      event.preventDefault()
      choose(picked)
      return
    }
    emit('enter', event)
  }
}

defineExpose({
  /** Moves focus to the input. */
  focus: (): void => input.value?.focus(),
})
</script>

<template>
  <span class="exercise-suggestion-wrap">
    <input
      :id="inputId"
      ref="input"
      :value="modelValue"
      maxlength="80"
      required
      :placeholder="placeholder"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="visible"
      :aria-controls="listId"
      :aria-activedescendant="activeId"
      @input="onInput"
      @focus="openList"
      @blur="close"
      @change="emit('change')"
      @keydown="onKeydown"
    >
    <span
      :id="listId"
      ref="list"
      class="exercise-suggestions"
      role="listbox"
      :hidden="!visible"
    >
      <span
        v-for="(name, index) in matches"
        :id="`${listId}-option-${index}`"
        :key="name"
        class="exercise-suggestion-option"
        role="option"
        :aria-selected="index === active"
        @pointerdown.prevent
        @click="choose(name)"
      >{{ name }}</span>
    </span>
  </span>
</template>
