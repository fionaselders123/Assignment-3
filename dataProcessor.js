require('dotenv').config();

const path = require('path');
const { healthMetricsCounter } = require('./healthReader');
const { workoutCalculator } = require('./workoutReader');

async function processFiles() {
  const userName = process.env.USER_NAME || 'there';
  const weeklyGoal = parseInt(process.env.WEEKLY_GOAL, 10);

  console.log(`Processing data for: ${userName}`);

  try {
    console.log('Reading workout data');
    const workoutData = await workoutCalculator(
      path.join(__dirname, 'data', 'workouts.csv')
    );

    console.log('Reading health data');
    const healthData = await healthMetricsCounter(
      path.join(__dirname, 'data', 'health-metrics.json')
    );

    if (!workoutData || !healthData) {
      console.log(
        '\n Could not load all of your data, so the summary is incomplete.'
      );
      return null;
    }


    console.log('Workouts found:', workoutData.totalWorkouts);
    console.log('Total workout minutes:', workoutData.totalMinutes);
    console.log('Health entries found:', healthData.totalEntries);

    if (Number.isNaN(weeklyGoal)) {
      console.log(' WEEKLY_GOAL is missing or not a number in your .env file');
    } else {
      console.log('Weekly goal:', weeklyGoal, 'minutes');

      if (workoutData.totalMinutes > weeklyGoal) {
        console.log(
          `🎉 Congratulations ${userName}! You have exceeded your weekly goal!`
        );
      } else if (workoutData.totalMinutes === weeklyGoal) {
        console.log(` Great job ${userName}! You met your weekly goal!`);
      } else {
        const remaining = weeklyGoal - workoutData.totalMinutes;
        console.log(
          ` Keep going ${userName}! You are ${remaining} minutes away from your weekly goal.`
        );
      }
    }

    return { workoutData, healthData, weeklyGoal };
  } catch (error) {
    console.log(' Something went wrong while processing files:', error.message);
    return null;
  }
}

module.exports = { processFiles };

if (require.main === module) {
  processFiles();
}