import * as fs from 'fs';
import * as path from 'path';

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

  it('falls back to t = sample index when no time column is present', () => {
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

  it('builds t as elapsed seconds from the first parsed timestamp (variable sample rate)', () => {
    // Three rows at non-uniform 100 ms / 900 ms / 1500 ms offsets.
    const csv = [
      'GPS Time,Speed (OBD)(mph)',
      '10-May-2026 09:34:12.000,0',
      '10-May-2026 09:34:12.100,3',
      '10-May-2026 09:34:13.000,9',
      '10-May-2026 09:34:14.500,20'
    ].join('\n');
    const { rows } = parseCsv(csv);
    expect(rows[0].t).toBeCloseTo(0,   3);
    expect(rows[1].t).toBeCloseTo(0.1, 3);
    expect(rows[2].t).toBeCloseTo(1.0, 3);
    expect(rows[3].t).toBeCloseTo(2.5, 3);
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

  /**
   * Disambiguation tests — each cluster of Torque Pro headers that
   * share substrings was previously mis-routing to a single canonical
   * field. These guard the specific-before-generic rule that prevents
   * the collisions.
   */
  describe('disambiguation', () => {
    it('routes Relative / Absolute-B / Manifold throttle columns to distinct fields', () => {
      const csv = [
        'Relative Throttle Position(%),Absolute Throttle Position B(%),Throttle Position(Manifold)(%)',
        '4,15,7'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual([
        'throttle_rel',
        'throttle_b_abs',
        'throttle'
      ]);
      expect(rows[0].throttle_rel).toBe(4);
      expect(rows[0].throttle_b_abs).toBe(15);
      expect(rows[0].throttle).toBe(7);
    });

    it('routes Control Module / OBD Adapter voltage columns to distinct fields', () => {
      const csv = 'Voltage (Control Module)(V),Voltage (OBD Adapter)(V)\n14.5,12.3\n';
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual(['voltage', 'voltage_obd']);
      expect(rows[0].voltage).toBe(14.5);
      expect(rows[0].voltage_obd).toBe(12.3);
    });

    it('routes Turbo Boost / Commanded A-B / Sensor A-B boost columns to distinct fields', () => {
      const csv = [
        'Turbo Boost & Vacuum Gauge(psi),Boost Pressure Commanded A(psi),Boost Pressure Commanded B(psi),Boost Pressure Sensor A(psi),Boost Pressure Sensor B(psi)',
        '12,11,11,11.5,11.5'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual([
        'boost_psi',
        'boost_cmd_a_psi',
        'boost_cmd_b_psi',
        'boost_sensor_a_psi',
        'boost_sensor_b_psi'
      ]);
      expect(rows[0].boost_psi).toBe(12);
      expect(rows[0].boost_cmd_a_psi).toBe(11);
      expect(rows[0].boost_sensor_a_psi).toBe(11.5);
    });

    it('routes Mass Air Flow Rate / sensor A / sensor B to distinct fields', () => {
      const csv = [
        'Mass Air Flow Rate(g/s),Mass air flow sensor A(g/s),Mass air flow sensor B(g/s)',
        '12,6,6'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual([
        'maf',
        'maf_sensor_a',
        'maf_sensor_b'
      ]);
      expect(rows[0].maf).toBe(12);
      expect(rows[0].maf_sensor_a).toBe(6);
    });

    it('routes Fuel Rail Pressure absolute vs relative variants to distinct fields', () => {
      const csv = [
        'Fuel Rail Pressure(psi),Fuel Rail Pressure (relative to manifold vacuum)(psi)',
        '2887,580'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual(['fuel_rail_abs', 'fuel_rail_rel']);
      expect(rows[0].fuel_rail_abs).toBe(2887);
      expect(rows[0].fuel_rail_rel).toBe(580);
    });

    it('routes Engine reference torque vs Torque to distinct fields', () => {
      const csv = 'Engine reference torque(Nm),Torque(Nm)\n520,326\n';
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual(['tq_reference_nm', 'tq_nm']);
      expect(rows[0].tq_reference_nm).toBe(520);
      expect(rows[0].tq_nm).toBe(326);
    });

    it('does not confuse "Average trip speed(...)(mph)" with vehicle speed', () => {
      const csv = [
        'Average trip speed(whilst moving only)(mph),Average trip speed(whilst stopped or moving)(mph),Speed (OBD)(mph)',
        '27,23,60'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual([
        'avg_speed_moving_mph',
        'avg_speed_total_mph',
        'speed_mph'
      ]);
      expect(rows[0].speed_mph).toBe(60);
      expect(rows[0].avg_speed_moving_mph).toBe(27);
    });

    it('routes CO₂ Average / Instantaneous variants to distinct fields', () => {
      const csv = 'CO₂ in g/km (Average)(g/km),CO₂ in g/km (Instantaneous)(g/km)\n1115,180\n';
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual(['co2_avg', 'co2']);
      expect(rows[0].co2_avg).toBe(1115);
      expect(rows[0].co2).toBe(180);
    });

    it('routes Intake Manifold Pressure (psi/kPa) + Manfold Abs A/B (typo, psi) to distinct fields', () => {
      const csv = [
        'Intake Manifold Pressure(psi),Intake Manfold Abs Pressure A(psi),Intake Manfold Abs Pressure B(psi)',
        '8,12,13'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual([
        'manifold_psi',
        'manifold_abs_a_psi',
        'manifold_abs_b_psi'
      ]);
      expect(rows[0].manifold_psi).toBe(8);
      expect(rows[0].manifold_abs_a_psi).toBe(12);
    });
  });

  /**
   * New PIDs introduced from real-export inspection. None of these
   * existed in the design's simplified catalog.
   */
  describe('new PIDs from real Torque Pro exports', () => {
    it('recognizes G(x) / G(y) / G(z) / G(calibrated) Torque-style g-force headers', () => {
      const csv = 'G(x),G(y),G(z),G(calibrated)\n0.05,3.17,-10.31,0.12\n';
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual(['gx', 'gy', 'gz', 'gcal']);
      expect(rows[0].gx).toBeCloseTo(0.05);
    });

    it('recognizes the spelled-out "Horizontal Dilution of Precision" header as hdop', () => {
      const { detectedColumns } = parseCsv('Horizontal Dilution of Precision\n0.9\n');
      expect(detectedColumns[0].mappedTo).toBe('hdop');
    });

    it('recognizes Ambient air temp / Charge Air Cooler / 0-60 time / Fuel Level / Alcohol headers', () => {
      const csv = [
        'Ambient air temp(°F),Charge air cooler temperature (CACT)(°F),0-60mph Time(s),Fuel Level (From Engine ECU)(%),Alcohol Fuel Percentage(%)',
        '78,90,4.8,55,10'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual([
        'ambient_f',
        'cact_f',
        'time_0_to_60_s',
        'fuel_level_pct',
        'alcohol_pct'
      ]);
      expect(rows[0].ambient_f).toBe(78);
      expect(rows[0].cact_f).toBe(90);
      expect(rows[0].time_0_to_60_s).toBe(4.8);
    });

    it('recognizes Percentage of City / Highway / Idle driving headers', () => {
      const csv = [
        'Percentage of City driving(%),Percentage of Highway driving(%),Percentage of Idle driving(%)',
        '63.66,20.98,15.37'
      ].join('\n');
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual(['pct_city', 'pct_highway', 'pct_idle']);
      expect(rows[0].pct_city).toBeCloseTo(63.66);
    });

    it('recognizes Acceleration Sensor (Total) as accel_total_g', () => {
      const { rows, detectedColumns } = parseCsv('Acceleration Sensor(Total)(g)\n0.13\n');
      expect(detectedColumns[0].mappedTo).toBe('accel_total_g');
      expect(rows[0].accel_total_g).toBeCloseTo(0.13);
    });

    it('recognizes Fuel flow rate/minute(gal/min) as fuel_flow_gpm distinct from fuel_rate', () => {
      const csv = 'Fuel flow rate/minute(gal/min),Fuel Rate (direct from ECU)(L/m)\n0.01,2.5\n';
      const { rows, detectedColumns } = parseCsv(csv);
      expect(detectedColumns.map((column) => column.mappedTo)).toEqual(['fuel_flow_gpm', 'fuel_rate']);
      expect(rows[0].fuel_flow_gpm).toBeCloseTo(0.01);
      expect(rows[0].fuel_rate).toBeCloseTo(2.5);
    });
  });

  /**
   * Real-file fixture sanity check. The fixture is a 83-sample slice of
   * a Torque Pro export (Mercedes AMG, 81 columns), with GPS lat/lon
   * rounded to 2 decimal places for repo privacy. The slice spans early
   * "no GPS lock" rows, mid-session driving with GPS, and end-of-trip
   * rows so the test exercises every detection path.
   */
  describe('real Torque Pro export fixture', () => {
    const fixtureText = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'sample-torque-export.csv'),
      'utf-8'
    );

    it('parses 83 rows from the fixture', () => {
      const { rows } = parseCsv(fixtureText);
      expect(rows).toHaveLength(83);
    });

    it('detects most columns in the real-fixture (rest are catalyst / exhaust / hybrid — null)', () => {
      const { detectedColumns } = parseCsv(fixtureText);
      const recognized = detectedColumns.filter((column) => column.mappedTo !== null);
      // Real Torque export has 84 columns (incl. 2 time columns).
      expect(detectedColumns).toHaveLength(84);
      // 14 columns are intentionally left unrecognized (catalyst ×4 +
      // exhaust gas temp ×8 + exhaust pressure ×2 + hybrid ×4 = 18) —
      // remaining 66 should map.
      expect(recognized.length).toBeGreaterThan(60);
    });

    it('has no duplicate canonical fields across detected columns', () => {
      const { detectedColumns } = parseCsv(fixtureText);
      const recognized = detectedColumns
        .map((column) => column.mappedTo)
        .filter((mapped): mapped is string => mapped !== null && mapped !== 'time');
      const seen = new Set<string>();
      for (const field of recognized) {
        expect(seen.has(field)).toBe(false);
        seen.add(field);
      }
    });

    it('parses real timestamps from Device Time into ts + builds elapsed t', () => {
      const { rows } = parseCsv(fixtureText);
      const firstTs = rows[0].ts;
      const lastTs = rows[rows.length - 1].ts;
      expect(firstTs).toBeGreaterThan(0);
      expect(lastTs).toBeGreaterThan(firstTs);
      expect(rows[0].t).toBeCloseTo(0, 3);
      expect(rows[rows.length - 1].t).toBeGreaterThan(0);
    });

    it('captures real values for the actively-populated PIDs in the fixture', () => {
      const { rows } = parseCsv(fixtureText);
      const sample = rows[rows.length - 30];
      // Spot-check fields that this real session reliably populates.
      expect(sample.coolant_f).toBeDefined();
      expect(sample.rpm).toBeDefined();
      expect(sample.throttle).toBeDefined();
      expect(sample.voltage).toBeDefined();
      expect(sample.voltage_obd).toBeDefined();
      expect(sample.tq_reference_nm).toBeDefined();
    });
  });
});
