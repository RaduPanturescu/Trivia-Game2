/** Public QR-code image service used by the legacy dev tools. */
const QR_ENDPOINT = 'https://api.qrserver.com/v1/create-qr-code/'

/**
 * Builds the 240x240 QR image URL for a piece of text.
 * @param text - Text or link to encode.
 * @returns The image URL.
 */
export function qrCodeUrl(text: string): string {
  return `${QR_ENDPOINT}?size=240x240&data=${encodeURIComponent(text)}`
}

/**
 * Loads an image in the background so the caller knows whether it can be shown.
 * @param url - Image URL to load.
 * @returns Resolves once the image has loaded.
 * @throws When the image fails to load (service down or offline).
 */
export function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = new Image()
    probe.onload = () => resolve()
    probe.onerror = () => reject(new Error('QR code image failed to load'))
    probe.src = url
  })
}
