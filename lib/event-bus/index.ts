import type { OlayYukü } from '@/types/events'

type OlayDinleyici<T> = (yük: T) => void | Promise<void>

class OlayYolu {
  private dinleyiciler = new Map<string, OlayDinleyici<unknown>[]>()

  abone<T extends keyof OlayYukü>(olay: T, dinleyici: OlayDinleyici<OlayYukü[T]>) {
    const mevcutlar = this.dinleyiciler.get(olay) ?? []
    this.dinleyiciler.set(olay, [...mevcutlar, dinleyici as OlayDinleyici<unknown>])
  }

  async yayimla<T extends keyof OlayYukü>(olay: T, yük: OlayYukü[T]) {
    const dinleyiciler = this.dinleyiciler.get(olay) ?? []
    await Promise.all(dinleyiciler.map((d) => d(yük)))
  }
}

export const olayYolu = new OlayYolu()
