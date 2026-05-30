export class SeededRandom {
  private state: number;

  constructor(seed: string | number) {
    this.state =
      typeof seed === "number" ? seed >>> 0 : SeededRandom.hashString(seed);
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  static fromState(state: number): SeededRandom {
    const random = new SeededRandom(1);
    random.state = state >>> 0;
    return random;
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0 || !Number.isFinite(maxExclusive)) {
      throw new Error(`Invalid random bound: ${maxExclusive}`);
    }
    return Math.floor(this.next() * maxExclusive);
  }

  range(minInclusive: number, maxInclusive: number): number {
    return minInclusive + this.int(maxInclusive - minInclusive + 1);
  }

  choice<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new Error("Cannot choose from an empty array");
    }
    return values[this.int(values.length)];
  }

  getState(): number {
    return this.state >>> 0;
  }

  private static hashString(seed: string): number {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
}

