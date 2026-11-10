const path = require('path');
const fs = require('fs/promises');
const { healthMetricsCounter } = require('../healthReader');

const TEST_FILE = path.join(__dirname, 'test-health.json');
const INVALID_FILE = path.join(__dirname, 'test-health-invalid.json');
const WRONG_SHAPE_FILE = path.join(__dirname, 'test-health-wrong-shape.json');
const EMPTY_METRICS_FILE = path.join(__dirname, 'test-health-empty.json');

const testData = {
  user: 'TestUser',
  metrics: [
    { date: '2024-01-01', type: 'sleep', duration: '7.5' },
    { date: '2024-01-01', type: 'nutrition', calories: '2100' },
    { date: '2024-01-02', type: 'sleep', duration: '8.0' },
  ],
};

let logSpy;

beforeAll(async () => {
  await fs.writeFile(TEST_FILE, JSON.stringify(testData));
  await fs.writeFile(INVALID_FILE, '{ this is not valid json');
  await fs.writeFile(WRONG_SHAPE_FILE, JSON.stringify({ user: 'TestUser' }));
  await fs.writeFile(
    EMPTY_METRICS_FILE,
    JSON.stringify({ user: 'TestUser', metrics: [] })
  );
});

afterAll(async () => {
  for (const file of [
    TEST_FILE,
    INVALID_FILE,
    WRONG_SHAPE_FILE,
    EMPTY_METRICS_FILE,
  ]) {
    try {
      await fs.unlink(file);
    } catch {
      // It's okay if the file is already gone
    }
  }
});

beforeEach(() => {
  // Keep test output clean; the functions print messages with console.log
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe('healthMetricsCounter', () => {
  test('reads a valid JSON file and counts entries', async () => {
    const result = await healthMetricsCounter(TEST_FILE);
    expect(result).not.toBeNull();
    expect(result.totalEntries).toBe(3);
  });

  test('returns the expected data structure', async () => {
    const result = await healthMetricsCounter(TEST_FILE);
    expect(result).toEqual({ user: 'TestUser', totalEntries: 3 });
  });

  test('counts 0 entries when the metrics array is empty', async () => {
    const result = await healthMetricsCounter(EMPTY_METRICS_FILE);
    expect(result.totalEntries).toBe(0);
  });

  test('returns null when the file is missing', async () => {
    const result = await healthMetricsCounter('missing.json');
    expect(result).toBeNull();
  });

  test('prints a helpful message when the file is missing', async () => {
    await healthMetricsCounter('missing.json');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('not found')
    );
  });

  test('returns null when the JSON is invalid', async () => {
    const result = await healthMetricsCounter(INVALID_FILE);
    expect(result).toBeNull();
  });

  test('prints a helpful message when the JSON is invalid', async () => {
    await healthMetricsCounter(INVALID_FILE);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'));
  });

  test('returns null when the metrics array is missing', async () => {
    const result = await healthMetricsCounter(WRONG_SHAPE_FILE);
    expect(result).toBeNull();
  });

  test('reads the real data/health-metrics.json file', async () => {
    const result = await healthMetricsCounter(
      path.join(__dirname, '..', 'data', 'health-metrics.json')
    );
    expect(result.totalEntries).toBe(8);
  });
});