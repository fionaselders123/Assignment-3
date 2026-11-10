const path = require('path');
const fs = require('fs');
const { readWorkoutData, workoutCalculator } = require('../workoutReader');

const TEST_CSV_FILE = path.join(__dirname, 'test-workouts.csv');
const EMPTY_CSV_FILE = path.join(__dirname, 'test-workouts-empty.csv');
const BAD_CSV_FILE = path.join(__dirname, 'test-workouts-bad.csv');

const testCsvData = `date,exercise,duration,calories
2024-01-01,Running,30,300
2024-01-02,Cycling,45,400
2024-01-03,Yoga,60,200`;

const emptyCsvData = `date,exercise,duration,calories`;

const badCsvData = `date,exercise,duration,calories
2024-01-01,Running,30,300
2024-01-02,Cycling,abc,400
2024-01-03,Yoga,60,200`;

let logSpy;

beforeAll(() => {
  fs.writeFileSync(TEST_CSV_FILE, testCsvData);
  fs.writeFileSync(EMPTY_CSV_FILE, emptyCsvData);
  fs.writeFileSync(BAD_CSV_FILE, badCsvData);
});

afterAll(() => {
  for (const file of [TEST_CSV_FILE, EMPTY_CSV_FILE, BAD_CSV_FILE]) {
    try {
      fs.unlinkSync(file);
    } catch {
   
    }
  }
});

beforeEach(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
});

describe('readWorkoutData', () => {
  test('returns an array of row objects', async () => {
    const data = await readWorkoutData(TEST_CSV_FILE);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
  });

  test('rows have the expected properties', async () => {
    const data = await readWorkoutData(TEST_CSV_FILE);
    expect(data[0]).toHaveProperty('date');
    expect(data[0]).toHaveProperty('exercise');
    expect(data[0]).toHaveProperty('duration');
    expect(data[0]).toHaveProperty('calories');
  });

  test('values come back as strings', async () => {
    const data = await readWorkoutData(TEST_CSV_FILE);
    expect(data[0].exercise).toBe('Running');
    expect(data[0].duration).toBe('30');
  });

  test('returns an empty array for a CSV with only a header', async () => {
    const data = await readWorkoutData(EMPTY_CSV_FILE);
    expect(data).toEqual([]);
  });

  test('rejects when the file is missing', async () => {
    await expect(readWorkoutData('missing.csv')).rejects.toThrow();
  });
});

describe('workoutCalculator', () => {
  test('counts workouts and totals minutes for a valid CSV', async () => {
    const result = await workoutCalculator(TEST_CSV_FILE);
    expect(result).not.toBeNull();
    expect(result.totalWorkouts).toBe(3);
    expect(result.totalMinutes).toBe(135);
  });

  test('returns the expected data structure', async () => {
    const result = await workoutCalculator(TEST_CSV_FILE);
    expect(result).toEqual({ totalWorkouts: 3, totalMinutes: 135 });
  });

  test('returns 0 workouts and 0 minutes for an empty CSV', async () => {
    const result = await workoutCalculator(EMPTY_CSV_FILE);
    expect(result).toEqual({ totalWorkouts: 0, totalMinutes: 0 });
  });

  test('skips rows with an invalid duration and warns about them', async () => {
    const result = await workoutCalculator(BAD_CSV_FILE);
    expect(result.totalWorkouts).toBe(3);
    expect(result.totalMinutes).toBe(90);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('invalid duration')
    );
  });

  test('returns null when the file is missing', async () => {
    const result = await workoutCalculator('missing.csv');
    expect(result).toBeNull();
  });

  test('prints a helpful message when the file is missing', async () => {
    await workoutCalculator('missing.csv');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  test('reads the real data/workouts.csv file', async () => {
    const result = await workoutCalculator(
      path.join(__dirname, '..', 'data', 'workouts.csv')
    );
    expect(result.totalWorkouts).toBe(10);
    expect(result.totalMinutes).toBe(330);
  });
});