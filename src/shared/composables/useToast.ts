import { computed, ref, type Ref } from 'vue'
import { SFX, useAudio } from './useAudio'

/** Visual style of a toast: the default card, the centered Maya card (silent), or the task card. */
export type ToastVariant = 'default' | 'maya' | 'task'

/** Icon shown at the start of a toast: an emoji or an image URL. */
export interface ToastIcon {
  /** Emoji rendered as text. */
  emoji?: string
  /** Image URL rendered cover-fitted. */
  image?: string
}

/** Options accepted by {@link ToastApi.show}. */
export interface ToastOptions {
  /** Heading of the toast. */
  title: string
  /** Body text of the toast. */
  message: string
  /** Optional icon at the start of the toast. */
  icon?: ToastIcon
  /** Visual variant. Defaults to `default`. */
  variant?: ToastVariant
  /** Time in milliseconds before the toast is removed. Defaults depend on the variant. */
  duration?: number
}

/** A toast currently on screen. */
export interface Toast {
  /** Unique id used as the list key and for removal. */
  id: number
  /** Heading of the toast. */
  title: string
  /** Body text of the toast. */
  message: string
  /** Optional icon at the start of the toast. */
  icon?: ToastIcon
  /** Visual variant. */
  variant: ToastVariant
}

/** Public surface of the shared toast queue returned by {@link useToast}. */
export interface ToastApi {
  /** Toasts currently on screen, oldest first. */
  toasts: Readonly<Ref<Toast[]>>
  /** Adds a toast, plays the pop sound (except for the Maya variant), and removes it after its duration. */
  show: (options: ToastOptions) => void
}

/** Removal delay per variant, as in the legacy app. */
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  default: 4500,
  task: 6500,
  maya: 2500,
}

const list = ref<Toast[]>([])
let lastId = 0

/**
 * Adds a toast to the queue and schedules its removal.
 * @param options - Toast content and timing.
 */
function show(options: ToastOptions): void {
  const variant = options.variant ?? 'default'
  if (variant !== 'maya') useAudio().playSfx(SFX.pop)

  const id = ++lastId
  list.value.push({
    id,
    title: options.title,
    message: options.message,
    icon: options.icon,
    variant,
  })
  window.setTimeout(() => {
    list.value = list.value.filter((toast) => toast.id !== id)
  }, options.duration ?? DEFAULT_DURATION[variant])
}

const api: ToastApi = {
  toasts: computed(() => list.value),
  show,
}

/**
 * Returns the app-wide toast queue. All callers share the same list.
 * @returns The shared {@link ToastApi}.
 */
export function useToast(): ToastApi {
  return api
}
