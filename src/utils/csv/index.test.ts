import { parseCsv } from '.';

/**
 * The CSV adapter is the seam between Torque Pro's column conventions
 * and the renderer's `SessionDataRow` shape. Tests cover four pillars:
 *   - header recognition (each common PID maps to the right field),
 *   - unit-suffix disambiguation (°F vs °C, mph vs km/h, psi vs kPa),
 *   - row-data parsing (numbers, missing cells, sample index),
 *   - graceful fallback (unknown columns ignored, no-time-column case).
 */

describe('utils/csv', () => {
  it('returns empty rows for a header-only CSV', () => {
    const result = parseCsv('Speed (OBD)(mph),Engine RPM(rpm)\n');
    expect(result.rows).toEqual([]);
    expect(result.detectedColumns).toHaveLength(2);
  });

  it('maps the most common Torque Pro headers to canonical fields', () => {
    const csv = [
      'GPS Time,Speed (OBD)(mph),Engine RPM(rpm),Throttle Position(Manifold)(%),Coolant Temperature(°F)',
      '10-May-2026 09:34:12,0,820,4,82',
      '10-May-2026 09:34:13,3,1180,18,84'
    ].join('\n');
    const { rows, detectedColumns } = parseCsv(csv);

    expect(detectedColumns.map((column) => column.mappedTo)).toEqual([
      'time',
      'speed_mph',
      'rpm',
      'throttle',
      'coolant_f'
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].speed_mph).toBe(0);
    expect(rows[0].rpm).toBe(820);
    expect(rows[0].throttle).toBe(4);
    expect(rows[0].coolant_f).toBe(82);
    expect(rows[1].speed_mph).toBe(3);
  });

  it('disambiguates imperial vs metric temperature columns', () => {
    const csv = 'Coolant Temperature(°C)\n28\n';
    const { rows, detectedColumns } = parseCsv(csv);
    expect(detectedColumns[0].mappedTo).toBe('coolant_c');
    expect(rows[0].coolant_c).toBe(28);
    expect(rows[0].coolant_f).toBeUndefined();
  });

  it('disambiguates psi vs kPa boost columns', () => {
    const { detectedColumns: psiColumns } = parseCsv('Turbo Boost(psi)\n12\n');
    const { detectedColumns: kpaColumns } = parseCsv('Turbo Boost(kPa)\n82\n');
    expect(psiColumns[0].mappedTo).toBe('boost_psi');
    expect(kpaColumns[0].mappedTo).toBe('boost_kpa');
  });

  it('recognizes both km/h and m/s GPS-speed columns', () => {
    const kphResult = parseCsv('GPS Speed(km/h)\n45\n');
    const msResult  = parseCsv('GPS Speed(Meters/second)\n12.4\n');
    expect(kphResult.detectedColumns[0].mappedTo).toBe('speed_kph');
    expect(msResult.detectedColumns[0].mappedTo).toBe('speed_ms');
  });

  it('routes engine-load absolute before engine-load (specific before general)', () => {
    const csv = 'Engine Load(Absolute)(%),Engine Load(Calculated)(%)\n42,55\n';
    const { rows, detectedColumns } = parseCsv(csv);
    expect(detectedColumns[0].mappedTo).toBe('load_abs');
    expect(detectedColumns[1].mappedTo).toBe('load');
    expect(rows[0].load_abs).toBe(42);
    expect(rows[0].load).toBe(55);
  });

  it('maps torque columns to imperial vs metric variants', () => {
    const lbftResult = parseCsv('Torque(ft-lb)\n240\n');
    const nmResult   = parseCsv('Torque(Nm)\n326\n');
    expect(lbftResult.detectedColumns[0].mappedTo).toBe('tq_lbft');
    expect(nmResult.detectedColumns[0].mappedTo).toBe('tq_nm');
  });

  it('reports unrecognized columns with mappedTo: null', () => {
    const csv = 'Speed (OBD)(mph),Mystery Probe (XYZ)(units)\n42,99\n';
    const { rows, detectedColumns } = parseCsv(csv);
    expect(detectedColumns[1].mappedTo).toBeNull();
    expect(detectedColumns[1].header).toBe('Mystery Probe (XYZ)(units)');
    // Unknown columns don't leak any extra keys onto SessionDataRow.
    expect(Object.keys(rows[0])).toEqual(expect.arrayContaining(['t', 'ts', 'speed_mph']));
    expect(Object.keys(rows[0])).not.toContain('Mystery Probe (XYZ)(units)');
  });

  it('treats blank / dash / question-mark cells as missing values', () => {
    const csv = [
      'Speed (OBD)(mph),Engine RPM(rpm),Throttle Position(%)',
      ',-,?',
      '30,2000,'
    ].join('\n');
    const { rows } = parseCsv(csv);
    expect(rows[0].speed_mph).toBeUndefined();
    expect(rows[0].rpm).toBeUndefined();
    expect(rows[0].throttle).toBeUndefined();
    expect(rows[1].speed_mph).toBe(30);
    expect(rows[1].rpm).toBe(2000);
    expect(rows[1].throttle).toBeUndefined();
  });

  it('builds t from the zero-based sample index', () => {
    const csv = 'Speed (OBD)(mph)\n10\n20\n30\n';
    const { rows } = parseCsv(csv);
    expect(rows.map((row) => row.t)).toEqual([0, 1, 2]);
  });

  it('parses ts from the Torque Pro GPS Time format', () => {
    const csv = [
      'GPS Time,Speed (OBD)(mph)',
      '10-May-2026 09:34:12,0',
      '10-May-2026 09:34:13,5'
    ].join('\n');
    const { rows } = parseCsv(csv);
    expect(rows[0].ts).toBeGreaterThan(0);
    // Two samples one second apart should produce ts values 1000 ms apart.
    expect(rows[1].ts - rows[0].ts).toBe(1000);
  });

  it('parses ts from an ISO-8601 time column', () => {
    const csv = [
      'GPS Time,Speed (OBD)(mph)',
      '2026-05-10T09:34:12Z,0',
      '2026-05-10T09:34:13Z,5'
    ].join('\n');
    const { rows } = parseCsv(csv);
    expect(rows[1].ts - rows[0].ts).toBe(1000);
  });

  it('falls back to ts = t * 1000 when no time column is present', () => {
    const csv = 'Speed (OBD)(mph)\n10\n20\n';
    const { rows } = parseCsv(csv);
    expect(rows[0].ts).toBe(0);
    expect(rows[1].ts).toBe(1000);
  });

  it('ignores unparseable time values', () => {
    const csv = 'GPS Time,Speed (OBD)(mph)\nnot-a-date,10\n';
    const { rows } = parseCsv(csv);
    expect(rows[0].ts).toBe(0); // fallback to sample-index * 1000
  });

  it('recognizes AFR commanded vs measured', () => {
    const csv = 'Air/Fuel Ratio(Commanded)(:1),Air/Fuel Ratio(Measured)(:1)\n14.7,14.5\n';
    const { rows, detectedColumns } = parseCsv(csv);
    expect(detectedColumns[0].mappedTo).toBe('afr_cmd');
    expect(detectedColumns[1].mappedTo).toBe('afr_meas');
    expect(rows[0].afr_cmd).toBe(14.7);
    expect(rows[0].afr_meas).toBe(14.5);
  });

  it('recognizes GPS latitude and longitude', () => {
    const csv = 'Latitude,Longitude\n37.4419,-122.1430\n';
    const { rows, detectedColumns } = parseCsv(csv);
    expect(detectedColumns[0].mappedTo).toBe('lat');
    expect(detectedColumns[1].mappedTo).toBe('lon');
    expect(rows[0].lat).toBeCloseTo(37.4419);
    expect(rows[0].lon).toBeCloseTo(-122.1430);
  });
});
