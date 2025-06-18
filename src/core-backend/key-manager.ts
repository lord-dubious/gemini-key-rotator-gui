// src/core-backend/key-manager.ts

interface KeyState {
  exhaustedUntil?: number;
  // We could add more stats here later, like requestCount, errorCount
}

export class KeyManager {
  private keys: readonly string[];
  private keyStates: KeyState[];
  private currentKeyIndex: number = 0;
  private readonly defaultExhaustionDurationMs = 60 * 60 * 1000; // 1 hour

  constructor(apiKeys: string[]) {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error("KeyManager requires at least one API key.");
    }
    this.keys = Object.freeze([...apiKeys]); // Store a copy
    this.keyStates = this.keys.map(() => ({}));
  }

  public getNextAvailableKey(): { apiKey: string; keyIndex: number } | null {
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const potentialIndex = (this.currentKeyIndex + i) % this.keys.length;
      const state = this.keyStates[potentialIndex];

      if (!state.exhaustedUntil || state.exhaustedUntil < now) {
        // This key is available
        this.currentKeyIndex = (potentialIndex + 1) % this.keys.length; // Advance for next call
        return { apiKey: this.keys[potentialIndex], keyIndex: potentialIndex };
      }
    }
    return null; // All keys are currently exhausted
  }

  public markKeyAsExhausted(keyIndex: number, durationMs?: number): void {
    if (keyIndex < 0 || keyIndex >= this.keys.length) {
      console.warn(`Invalid keyIndex ${keyIndex} passed to markKeyAsExhausted.`);
      return;
    }
    const exhaustionTime = durationMs === undefined ? this.defaultExhaustionDurationMs : durationMs;
    this.keyStates[keyIndex] = {
      exhaustedUntil: Date.now() + exhaustionTime,
    };
    console.log(`Key at index ${keyIndex} marked as exhausted until ${new Date(this.keyStates[keyIndex].exhaustedUntil!).toISOString()}`);
  }

  public getAllKeyStates(): ReadonlyArray<KeyState> {
    return this.keyStates;
  }

  public getTotalKeys(): number {
    return this.keys.length;
  }

  public getActiveKeysCount(): number {
    const now = Date.now();
    return this.keyStates.filter(state => !state.exhaustedUntil || state.exhaustedUntil < now).length;
  }

  public getExhaustedKeysCount(): number {
    const now = Date.now();
    return this.keyStates.filter(state => state.exhaustedUntil && state.exhaustedUntil > now).length;
  }
}
