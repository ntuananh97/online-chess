import { type AudioEvent, AUDIO_URLS } from "@/lib/audio/audioTypes";

/**
 * Single place that uses the HTML5 Audio API. UI never touches `<audio>` or `Audio` directly.
 * Clone-on-play allows overlapping playback (e.g. fast moves in blitz).
 */
export class AudioManager {
  private static instance: AudioManager | null = null;

  private readonly templates = new Map<AudioEvent, HTMLAudioElement>();
  private volume = 1;
  private muted = false;
  private didPreload = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Load decode buffers for each clip (no-op on server / if already preloaded). */
  preloadAll(): void {
    if (typeof window === "undefined") return;
    if (this.didPreload) return;

    for (const event of Object.keys(AUDIO_URLS) as AudioEvent[]) {
      const url = AUDIO_URLS[event];
      const audio = new Audio(url);
      audio.preload = "auto";
      this.templates.set(event, audio);
    }
    this.didPreload = true;
  }

  play(event: AudioEvent): void {
    if (typeof window === "undefined") return;

    let template = this.templates.get(event);
    if (!template) {
      template = new Audio(AUDIO_URLS[event]);
      template.preload = "auto";
      this.templates.set(event, template);
    }

    const instance = template.cloneNode(true) as HTMLAudioElement;
    instance.volume = this.muted ? 0 : this.volume;
    instance.muted = this.muted;
    instance.currentTime = 0;
    // Browsers may reject play() before user gesture or during resource errors; never surface as unhandled rejection.
    // jsdom’s stub may return undefined instead of a Promise.
    void Promise.resolve(instance.play()).catch(() => {});
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (!this.muted) {
      for (const el of this.templates.values()) {
        el.volume = this.volume;
      }
    }
  }

  toggleMute(): void {
    this.muted = !this.muted;
    const effectiveVolume = this.muted ? 0 : this.volume;
    for (const el of this.templates.values()) {
      el.muted = this.muted;
      el.volume = effectiveVolume;
    }
  }
}

export const audio = AudioManager.getInstance();
