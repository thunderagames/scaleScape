import type { ScaleInstance } from '../theory/scale-instance'

export interface PlaybackPort {
  playScale(scale_instance: ScaleInstance): Promise<{ readonly ok: boolean }>
  stopAll(): Promise<void>
}
