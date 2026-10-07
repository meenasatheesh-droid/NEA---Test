/**
 * Synthesizes subtle ambient weather sound using Web Audio API
 */

class WeatherAudioManager {
  private ctx: AudioContext | null = null;
  private rainNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playRain(intensity: number = 0.5) {
    try {
      this.initContext();
      if (!this.ctx) return;

      this.stop();

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Pink / Brown noise for realistic soothing rain
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to simulate raindrops frequency
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800 + intensity * 1200;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(Math.min(0.12, 0.04 + intensity * 0.08), this.ctx.currentTime + 1.2);

      whiteNoise.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      whiteNoise.start(0);
      this.rainNode = whiteNoise;
      this.isPlaying = true;
    } catch (e) {
      console.warn('Audio synthesis not supported or blocked:', e);
    }
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.rainNode) {
            (this.rainNode as AudioBufferSourceNode).stop();
            this.rainNode.disconnect();
            this.rainNode = null;
          }
        }, 550);
      } catch {
        // cleanup
      }
    }
    this.isPlaying = false;
  }

  public toggle(intensity: number = 0.5): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.playRain(intensity);
      return true;
    }
  }

  public get active(): boolean {
    return this.isPlaying;
  }
}

export const weatherAudio = new WeatherAudioManager();
