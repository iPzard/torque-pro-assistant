import type { UnitsPreference } from 'state/preferences';

/** Miles → kilometers conversion factor (1 mi = 1.609344 km). */
const MILES_TO_KM = 1.609344;

/** psi → kPa conversion factor (1 psi = 6.894757 kPa). */
const PSI_TO_KPA = 6.894757;

/** A numeric value paired with its display unit. Used by both the
 *  Metric primitive (separate value / unit slots) and the formatX
 *  string helpers (which concatenate). */
export interface UnitConverted {
  readonly unit: string;
  readonly value: number;
}

/** Convert a distance from miles to the active units mode. */
export const convertDistance = (miles: number, units: UnitsPreference): UnitConverted =>
  units === 'metric'
    ? { unit: 'km', value: miles * MILES_TO_KM }
    : { unit: 'mi', value: miles };

/** Convert a speed from mph to the active units mode. */
export const convertSpeed = (mph: number, units: UnitsPreference): UnitConverted =>
  units === 'metric'
    ? { unit: 'km/h', value: mph * MILES_TO_KM }
    : { unit: 'mph',  value: mph };

/** Convert a boost pressure from psi to the active units mode. */
export const convertBoost = (psi: number, units: UnitsPreference): UnitConverted =>
  units === 'metric'
    ? { unit: 'kPa', value: psi * PSI_TO_KPA }
    : { unit: 'psi', value: psi };

/** Convert a temperature from °F to the active units mode. */
export const convertTemperature = (
  fahrenheit: number,
  units: UnitsPreference
): UnitConverted =>
  units === 'metric'
    ? { unit: '°C', value: (fahrenheit - 32) * (5 / 9) }
    : { unit: '°F', value: fahrenheit };

/**
 * Format a distance for display in the active units mode. Stored
 * values throughout the app are in miles (the dominant Torque Pro
 * export unit); this is the conversion / unit suffix layer.
 *
 * @param miles    Distance in miles.
 * @param units    Active units preference.
 * @param decimals Decimals after the point. Defaults to `1`.
 * @returns A pre-formatted distance string like `"124.6 mi"` or
 *   `"200.5 km"`.
 */
export const formatDistance = (
  miles: number,
  units: UnitsPreference,
  decimals = 1
): string => {
  const converted = convertDistance(miles, units);
  return `${ converted.value.toFixed(decimals) } ${ converted.unit }`;
};

/**
 * Format a speed for display in the active units mode. Stored values
 * are in mph; converts to km/h under metric.
 *
 * @param mph      Speed in miles per hour.
 * @param units    Active units preference.
 * @param decimals Decimals after the point. Defaults to `0`.
 * @returns A pre-formatted speed string like `"97 mph"` or `"156 km/h"`.
 */
export const formatSpeed = (
  mph: number,
  units: UnitsPreference,
  decimals = 0
): string => {
  const converted = convertSpeed(mph, units);
  return `${ converted.value.toFixed(decimals) } ${ converted.unit }`;
};

/**
 * Format a boost pressure for display in the active units mode.
 * Stored values are in psi; converts to kPa under metric.
 *
 * @param psi      Boost pressure in psi.
 * @param units    Active units preference.
 * @param decimals Decimals after the point. Defaults to `1`.
 * @returns A pre-formatted pressure string like `"21.4 psi"` or
 *   `"147.6 kPa"`.
 */
export const formatBoost = (
  psi: number,
  units: UnitsPreference,
  decimals = 1
): string => {
  const converted = convertBoost(psi, units);
  return `${ converted.value.toFixed(decimals) } ${ converted.unit }`;
};

/**
 * Format a temperature for display in the active units mode. Stored
 * values are in °F; converts to °C under metric using the standard
 * affine transform.
 *
 * @param fahrenheit Temperature in °F.
 * @param units      Active units preference.
 * @param decimals   Decimals after the point. Defaults to `0`.
 * @returns A pre-formatted temperature string like `"205 °F"` or
 *   `"96 °C"`.
 */
export const formatTemperature = (
  fahrenheit: number,
  units: UnitsPreference,
  decimals = 0
): string => {
  const converted = convertTemperature(fahrenheit, units);
  return `${ converted.value.toFixed(decimals) } ${ converted.unit }`;
};
