// Signal smoothing, One Euro Filter, and Tremor/Flapping filters

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.s = alpha * value + (1 - alpha) * (this.s as number);
    this.y = value;
    return this.s;
  }

  hasLast(): boolean {
    return this.y !== null;
  }

  last(): number {
    return this.y ?? 0;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

// 1€ Filter (One Euro Filter) for noise reduction with low latency
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.05, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max((timestampMs - this.lastTime) / 1000.0, 0.001);
    this.lastTime = timestampMs;
    const rate = 1.0 / dt;

    const dx = this.xFilter.hasLast() ? (value - this.xFilter.last()) * rate : 0;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dCutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(rate, cutoff));
  }

  reset() {
    this.lastTime = null;
    this.xFilter.reset();
    this.dxFilter.reset();
  }
}

// Exponential Moving Average filter
export class ExponentialMovingAverage {
  private alphaVal: number;
  private current: number | null = null;

  constructor(alpha: number = 0.25) {
    this.alphaVal = alpha;
  }

  filter(value: number): number {
    if (this.current === null) {
      this.current = value;
      return value;
    }
    this.current = this.alphaVal * value + (1 - this.alphaVal) * this.current;
    return this.current;
  }

  get(): number {
    return this.current ?? 0;
  }

  reset() {
    this.current = null;
  }
}

// Flapping & Hand Movement Oscillation Tracker
// Detects rhythmic up-and-down wrist motion characteristic of excitement or stress
export class FlappingOscillationTracker {
  private history: Array<{ y: number; time: number }> = [];
  private readonly windowMs: number;

  constructor(windowMs: number = 1500) {
    this.windowMs = windowMs;
  }

  addSample(wristY: number, timeMs: number): { isFlapping: boolean; frequencyHz: number; amplitude: number } {
    this.history.push({ y: wristY, time: timeMs });
    // Remove samples older than window
    const cutoff = timeMs - this.windowMs;
    this.history = this.history.filter((s) => s.time >= cutoff);

    if (this.history.length < 12) {
      return { isFlapping: false, frequencyHz: 0, amplitude: 0 };
    }

    // Compute mean Y
    const meanY = this.history.reduce((acc, s) => acc + s.y, 0) / this.history.length;

    // Detect zero-crossings (moving across mean)
    let zeroCrossings = 0;
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let i = 1; i < this.history.length; i++) {
      const prev = this.history[i - 1].y - meanY;
      const curr = this.history[i].y - meanY;
      if ((prev < 0 && curr >= 0) || (prev > 0 && curr <= 0)) {
        zeroCrossings++;
      }
      minVal = Math.min(minVal, this.history[i].y);
      maxVal = Math.max(maxVal, this.history[i].y);
    }

    const durationSec = (this.history[this.history.length - 1].time - this.history[0].time) / 1000;
    if (durationSec <= 0.3) {
      return { isFlapping: false, frequencyHz: 0, amplitude: 0 };
    }

    const frequencyHz = zeroCrossings / (2 * durationSec);
    const amplitude = maxVal - minVal;

    // Angelman hand flapping typically shows 2.0 to 6.0 Hz with noticeable amplitude
    const isFlapping = frequencyHz >= 2.0 && frequencyHz <= 6.5 && amplitude >= 0.06;

    return { isFlapping, frequencyHz, amplitude };
  }

  reset() {
    this.history = [];
  }
}
