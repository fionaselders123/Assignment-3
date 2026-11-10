const fs = require('fs');
const csv = require('csv-parser');


function readWorkoutData(filepath) {
  return new Promise((resolve, reject) => {
    const results = [];

    const fileStream = fs.createReadStream(filepath);
    fileStream.on('error', (error) => reject(error));

    fileStream
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}


async function workoutCalculator(filepath) {
  try {
    const workouts = await readWorkoutData(filepath);

    const totalWorkouts = workouts.length;
    let totalMinutes = 0;

    for (let i = 0; i < workouts.length; i++) {
      const minutes = parseFloat(workouts[i].duration);
      if (Number.isNaN(minutes)) {
        console.log(
          `⚠️ Skipping row ${i + 1}: invalid duration "${workouts[i].duration}"`
        );
        continue;
      }
      totalMinutes += minutes;
    }

    console.log('Total workouts:', totalWorkouts);
    console.log('Total minutes:', totalMinutes);

    return { totalWorkouts, totalMinutes };
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Workout CSV file not found, check the file path');
    } else {
      console.log('Error processing workout CSV file:', error.message);
    }
    return null;
  }
}

module.exports = { readWorkoutData, workoutCalculator };

if (require.main === module) {
  workoutCalculator('./data/workouts.csv');
}