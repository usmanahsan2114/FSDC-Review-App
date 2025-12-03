const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../docs/Cards Contact DAS 25.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet);

const ratingKeys = [
  'cockpitRealismLayout',
  'visualQualityFOV',
  'controlLoadingRealism',
  'motionFidelity',
  'aerodynamicResponse',
  'instrumentSwitchFunctionality',
  'visualMotionSync',
  'instructorControlTrainingFlow',
  'aircraftBehaviorMatch',
  'soundVibrationRealism',
  'overallImmersionRealism',
];

const reviews = rawData.map((row, index) => {
  const timestamp = Date.now() - (index * 1000 * 60 * 60); // Staggered timestamps
  const id = `review_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
  
  // Map Excel fields to Personal Info
  const personalInfo = {
    fullName: row['Name'] || 'Unknown',
    nationality: 'Saudi Arabia', // Default based on context
    profession: `${row['Occupation'] || ''} at ${row['Company'] || ''}`.trim(),
    previousSimulatorExperience: Math.random() > 0.5 ? 'Yes' : 'No',
    previousFlyingExperience: Math.random() > 0.5 ? 'Yes' : 'No',
    contact: row['Email'] || row['Phone Number'] || '',
  };

  // Generate Ratings
  const ratings = {};
  let sum = 0;
  ratingKeys.forEach(key => {
    // Random between 4.5 and 5.0, step 0.1
    const val = 4.5 + Math.floor(Math.random() * 6) / 10;
    ratings[key] = val;
    sum += val;
  });

  const overallRating = sum / ratingKeys.length;

  return {
    id,
    timestamp,
    reviewType: 'professional',
    personalInfo,
    ratings,
    overallRating,
    handwrittenComment: undefined,
    photos: [],
    textComment: 'Imported from Excel',
    simulatorId: 'sim_super_mushshak',
    simulatorName: 'Super Mushshak',
    simulatorType: 'aeromix',
    isSynced: false,
  };
});

// Adjust ratings to meet 4.7 average
let currentAvg = reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length;
console.log('Initial Average:', currentAvg);

// Simple adjustment: if avg is too high, lower some 5s to 4.5. If too low, raise some 4.5s to 5.
// Since we want exactly 4.7, we can just force it if needed, but random is fine if close.
// User said "total ratio... should be 4.7". I'll try to get it within 4.68 - 4.72.

let attempts = 0;
while (Math.abs(currentAvg - 4.7) > 0.02 && attempts < 1000) {
  const rIndex = Math.floor(Math.random() * reviews.length);
  const key = ratingKeys[Math.floor(Math.random() * ratingKeys.length)];
  const currentVal = reviews[rIndex].ratings[key];

  if (currentAvg > 4.7) {
    // Lower a rating
    if (currentVal > 4.5) {
      reviews[rIndex].ratings[key] = Math.max(4.5, currentVal - 0.1);
    }
  } else {
    // Raise a rating
    if (currentVal < 5.0) {
      reviews[rIndex].ratings[key] = Math.min(5.0, currentVal + 0.1);
    }
  }

  // Recalculate overall for that review
  let rSum = 0;
  ratingKeys.forEach(k => rSum += reviews[rIndex].ratings[k]);
  reviews[rIndex].overallRating = rSum / ratingKeys.length;

  // Recalculate global avg
  currentAvg = reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length;
  attempts++;
}

console.log('Final Average:', currentAvg);
console.log('Total Reviews:', reviews.length);

const outputPath = path.join(__dirname, '../assets/data/seed_reviews.json');
// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(outputPath, JSON.stringify(reviews, null, 2));
console.log('Wrote to:', outputPath);
