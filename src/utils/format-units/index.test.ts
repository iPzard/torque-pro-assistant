import { formatBoost, formatDistance, formatSpeed, formatTemperature } from '.';

describe('utils/format-units', () => {
  describe('formatDistance', () => {
    it('keeps miles under imperial', () => {
      expect(formatDistance(124.6, 'imperial')).toBe('124.6 mi');
    });

    it('converts to km under metric', () => {
      expect(formatDistance(100, 'metric')).toBe('160.9 km');
    });

    it('honors the decimals argument', () => {
      expect(formatDistance(100, 'metric', 0)).toBe('161 km');
    });
  });

  describe('formatSpeed', () => {
    it('keeps mph under imperial', () => {
      expect(formatSpeed(60, 'imperial')).toBe('60 mph');
    });

    it('converts to km/h under metric', () => {
      expect(formatSpeed(60, 'metric')).toBe('97 km/h');
    });
  });

  describe('formatBoost', () => {
    it('keeps psi under imperial', () => {
      expect(formatBoost(14.7, 'imperial')).toBe('14.7 psi');
    });

    it('converts to kPa under metric', () => {
      expect(formatBoost(14.7, 'metric')).toBe('101.4 kPa');
    });
  });

  describe('formatTemperature', () => {
    it('keeps °F under imperial', () => {
      expect(formatTemperature(212, 'imperial')).toBe('212 °F');
    });

    it('converts to °C under metric', () => {
      expect(formatTemperature(212, 'metric')).toBe('100 °C');
    });

    it('handles below-freezing temperatures correctly', () => {
      expect(formatTemperature(32, 'metric')).toBe('0 °C');
    });
  });
});
