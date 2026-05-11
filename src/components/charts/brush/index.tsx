import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './index.module.scss';

/** Permissive datum shape — accepts SessionDataRow and ad-hoc records. */
export type BrushDatum = Readonly<Record<string, number | undefined>>;

/** Three drag modes: drag left edge, right edge, or pan the whole window. */
type DragMode = 'left' | 'pan' | 'right';

export interface BrushProps {
  readonly color?: string;
  readonly data: readonly BrushDatum[];
  /** Field name to render the silhouette of (typically `speed_mph`). */
  readonly dataKey: string;
  /** Brush strip height in pixels. Defaults to the design's 56px. */
  readonly height?: number;
  /** Fires with the new `[from, to]` data-index pair after each drag step. */
  readonly onChange: (range: readonly [number, number]) => void;
  /** Controlled `[from, to]` data-index window. */
  readonly range: readonly [number, number];
  readonly testId?: string;
}

/** Minimum window size in data points. Prevents the user from collapsing
 *  the selection to zero. */
const MIN_WINDOW_SAMPLES = 5;

/**
 * Build a silhouette SVG path covering the entire data range. The
 * path stays in pixel coordinates so it scales with the parent width
 * via SVG's `viewBox` / `preserveAspectRatio`.
 */
const buildSilhouettePath = (
  data: readonly BrushDatum[],
  dataKey: string,
  totalWidth: number,
  totalHeight: number
): { area: string; line: string } => {
  if (data.length < 2) return { area: '', line: '' };
  let min = Infinity;
  let max = -Infinity;
  for (const row of data) {
    const value = row[dataKey];
    if (value === undefined) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { area: '', line: '' };
  if (max - min < 1e-6) max = min + 1;

  const innerPadding = 4;
  const innerHeight = totalHeight - innerPadding * 2;
  let lineDefinition = '';
  for (let index = 0; index < data.length; index += 1) {
    const value = data[index][dataKey] ?? min;
    const xCoord = (index / (data.length - 1)) * totalWidth;
    const yCoord = totalHeight - innerPadding - ((value - min) / (max - min)) * innerHeight;
    lineDefinition += `${index === 0 ? 'M' : 'L'}${xCoord.toFixed(1)},${yCoord.toFixed(1)}`;
  }
  const areaDefinition = `${lineDefinition} L${totalWidth},${totalHeight} L0,${totalHeight} Z`;
  return { area: areaDefinition, line: lineDefinition };
};

const clamp = (value: number, lower: number, upper: number): number =>
  Math.max(lower, Math.min(upper, value));

/**
 * Range-selection strip rendered below a chart (or stack of charts).
 * Shows a silhouette of one series and lets the user drag a window to
 * zoom the charts above. Output is a `[fromIndex, toIndex]` pair the
 * caller passes to `LineChart`'s `xRange` prop.
 *
 * Drag modes:
 *  - Pan: click-drag the body of the window.
 *  - Resize left: drag the left handle.
 *  - Resize right: drag the right handle.
 *
 * Window can't collapse below `MIN_WINDOW_SAMPLES` to keep the
 * downstream charts meaningful.
 *
 * @returns A controlled brush strip; pair it with the same `data` /
 *   `dataKey` the upstream chart consumes.
 */
function Brush({ color, data, dataKey, height = 56, onChange, range, testId }: BrushProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const element = containerRef.current;
    if (element === null) return undefined;
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const samples = data.length;
  const [fromIndex, toIndex] = range;
  const lastIndex = Math.max(0, samples - 1);
  const leftPercent = lastIndex === 0 ? 0 : (fromIndex / lastIndex) * 100;
  const rightPercent = lastIndex === 0 ? 100 : (toIndex / lastIndex) * 100;

  const silhouette = buildSilhouettePath(data, dataKey, width, height);
  const stroke = color ?? 'var(--mantine-color-amber-6)';

  const startDrag = useCallback((mode: DragMode) => (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect === undefined) return;

    const startClientX = event.clientX;
    const startFrom = fromIndex;
    const startTo = toIndex;

    const move = (moveEvent: PointerEvent): void => {
      const deltaPx = moveEvent.clientX - startClientX;
      const deltaSamples = Math.round((deltaPx / rect.width) * lastIndex);
      let nextFrom = startFrom;
      let nextTo = startTo;
      if (mode === 'left') {
        nextFrom = clamp(startFrom + deltaSamples, 0, startTo - MIN_WINDOW_SAMPLES);
      } else if (mode === 'right') {
        nextTo = clamp(startTo + deltaSamples, startFrom + MIN_WINDOW_SAMPLES, lastIndex);
      } else {
        if (startFrom + deltaSamples < 0) {
          nextFrom = 0;
          nextTo = startTo - startFrom;
        } else if (startTo + deltaSamples > lastIndex) {
          nextTo = lastIndex;
          nextFrom = startFrom + (lastIndex - startTo);
        } else {
          nextFrom = startFrom + deltaSamples;
          nextTo = startTo + deltaSamples;
        }
      }
      if (nextFrom !== fromIndex || nextTo !== toIndex) {
        onChange([nextFrom, nextTo]);
      }
    };

    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [fromIndex, toIndex, lastIndex, onChange]);

  return (
    <div
      ref={ containerRef }
      className={ styles.brush }
      data-testid={ testId }
      style={ { height } }
    >
      <svg
        className={ styles.silhouette }
        preserveAspectRatio="none"
        viewBox={ `0 0 ${width} ${height}` }
      >
        <path d={ silhouette.area } fill={ stroke } opacity={ 0.18 } />
        <path d={ silhouette.line } fill="none" stroke={ stroke } strokeWidth={ 1 } />
      </svg>
      <div className={ styles['mask-left'] } style={ { width: `${leftPercent}%` } } />
      <div className={ styles['mask-right'] } style={ { width: `${100 - rightPercent}%` } } />
      <div
        className={ styles.window }
        data-testid={ testId ? `${testId}-window` : undefined }
        onPointerDown={ startDrag('pan') }
        style={ { borderColor: stroke, left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` } }
      >
        <span
          className={ styles['handle-left'] }
          data-testid={ testId ? `${testId}-handle-left` : undefined }
          onPointerDown={ startDrag('left') }
          style={ { background: stroke } }
        />
        <span
          className={ styles['handle-right'] }
          data-testid={ testId ? `${testId}-handle-right` : undefined }
          onPointerDown={ startDrag('right') }
          style={ { background: stroke } }
        />
      </div>
    </div>
  );
}

export default Brush;
