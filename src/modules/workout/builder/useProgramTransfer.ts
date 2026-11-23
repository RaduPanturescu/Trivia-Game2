import { useToast } from '@/shared/composables/useToast'
import { useWorkoutStore } from '../core/store'
import { useWorkoutTimer } from '../timer/useWorkoutTimer'
import { parseWorkoutImport, serializeWorkoutExport, workoutExportFileName } from './planFile'

/**
 * Starts a browser download of a text file.
 * @param fileName - The download name.
 * @param text - The file contents.
 */
function downloadTextFile(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/** Public surface of the program export and import actions. */
export interface ProgramTransferApi {
  /** Downloads the whole program as a JSON file. */
  exportPlan(): void
  /**
   * Reads a chosen file, asks to replace the schedule, and imports it as a new saved plan.
   * @param file - The file the user chose.
   * @returns The id of the saved plan that was created, or `null` when nothing was imported.
   */
  importFile(file: File): Promise<string | null>
}

/**
 * Builds the export and import actions.
 * @returns The actions.
 */
export function useProgramTransfer(): ProgramTransferApi {
  const store = useWorkoutStore()
  const toast = useToast()
  const timer = useWorkoutTimer()

  return {
    exportPlan() {
      // Resolve the effective start first, so the export carries the same start date the dashboard shows.
      store.getProgramStartDate()
      const now = new Date()
      downloadTextFile(workoutExportFileName(now), serializeWorkoutExport(store.buildExport(now)))
      toast.show({ title: 'Program exported', message: 'Your workout plan was downloaded as JSON.', icon: { emoji: '📤' } })
    },

    async importFile(file) {
      try {
        const payload = parseWorkoutImport(await file.text())
        if (!confirm('Import this workout program and replace your current workout schedule?')) return null
        timer.resetActive()
        store.importProgram(payload, file.name)
        const name = file.name.trim() || 'Imported Workout Plan'
        toast.show({ title: 'Program imported', message: `Saved as “${name}”.`, icon: { emoji: '📥' } })
        const saved = store.savedPlans.value
        return saved[saved.length - 1]?.id ?? null
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        alert(`Could not import workout program: ${message}`)
        return null
      }
    },
  }
}
