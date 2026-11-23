import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from 'vue'

/** Identifies the info popover that is open across the whole page, or `null` when none is. */
const openPopover = ref<symbol | null>(null)

/** Open state of one info popover returned by {@link useInfoPopover}. */
export interface InfoPopover {
  /** Whether this popover is the one currently open. */
  isOpen: ComputedRef<boolean>
  /** Opens this popover (closing any other) or closes it if it is already open. */
  toggle: () => void
}

/**
 * Creates the open state for one info popover. Only one popover is open at a time, and a click
 * anywhere outside the popover's button closes it.
 * @returns The popover's open flag and its toggle.
 */
export function useInfoPopover(): InfoPopover {
  const token = Symbol('info-popover')
  const isOpen = computed(() => openPopover.value === token)

  function toggle(): void {
    openPopover.value = isOpen.value ? null : token
  }

  function closeOnOutsideClick(): void {
    openPopover.value = null
  }

  onMounted(() => document.addEventListener('click', closeOnOutsideClick))
  onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))

  return { isOpen, toggle }
}
