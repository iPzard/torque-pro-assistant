/**
 * jest-dom adds custom jest matchers for asserting on DOM nodes.
 * CRA looks for this file at src/setupTests.js (or .ts) by default.
 */
import '@testing-library/jest-dom';

/**
 * jsdom doesn't ship `ResizeObserver`, which Recharts'
 * `ResponsiveContainer` queries to react to layout changes. Provide a
 * no-op shim so chart components render (at 0×0 in tests, which is
 * fine — we only assert wrapper / testid presence, not SVG geometry).
 */
class NoopResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = NoopResizeObserver as unknown as typeof ResizeObserver;
