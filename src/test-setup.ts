import "@testing-library/jest-dom";

// Polyfill ResizeObserver for jsdom (React Flow requires it)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
