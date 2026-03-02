declare function describe(name: string, fn: () => void | Promise<void>): void;
declare function it(name: string, fn: () => void | Promise<void>): void;

declare type TestMatchers = {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toHaveLength(expected: number): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toThrow(): void;
};

declare type TestPromiseMatchers = {
  not: TestPromiseMatchers;
  toThrow(): Promise<void>;
};

declare function expect(actual: unknown): TestMatchers & {
  resolves: TestPromiseMatchers;
  not: TestMatchers;
};
