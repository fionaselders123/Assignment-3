const fs = require('fs/promises');

async function healthMetricsCounter(filepath) {
  try {
    const data = await fs.readFile(filepath, 'utf8');
    const healthData = JSON.parse(data);

    if (!healthData || !Array.isArray(healthData.metrics)) {
      console.log(' Invalid health data, expected a "metrics" array');
      return null;
    }

    const totalEntries = healthData.metrics.length;
    console.log('Total health entries:', totalEntries);

    return { user: healthData.user, totalEntries };
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Health file not found, check the file path');
    } else if (error.name === 'SyntaxError') {
      console.log('Invalid JSON, check the file format');
    } else {
      console.log(' Unknown error reading health file:', error.message);
    }
    return null;
  }
}

module.exports = { healthMetricsCounter };

if (require.main === module) {
  healthMetricsCounter('./data/health-metrics.json');
}