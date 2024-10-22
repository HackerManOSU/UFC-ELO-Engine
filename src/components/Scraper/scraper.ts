import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

interface FightData {
  event: string;
  fighter1: string;
  fighter2: string;
  result: string;
  KDs_fighter1: number;
  KDs_fighter2: number;
  STR_fighter1: number;
  STR_fighter2: number;
  TDs_fighter1: number;
  TDs_fighter2: number;
  Subs_fighter1: number;
  Subs_fighter2: number;
  weightClass: string;
  method: string;
  round: string;
  time: string;
}

interface FighterData {
  rating: number;
  peakRating: number;  // Track the highest rating achieved
  fights: number;
  lastFightDate: Date;
  weightClasses: Set<string>;
  ratingHistory: number[];
}

interface FighterRatings {
  [fighterName: string]: FighterData;
}

const DEFAULT_RATING = 1500;
const MAX_K_FACTOR = 32;
const MIN_K_FACTOR = 16;
const K_FACTOR_DECAY = 0.95;  // Rating volatility decreases with more fights

const fighterRatings: FighterRatings = {};

async function readCSV(filePath: string): Promise<FightData[]> {
  return new Promise((resolve, reject) => {
    const fights: FightData[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        const fightData: FightData = {
          event: data['Event'] || 'Unknown Event',
          fighter1: data['Fighter 1']?.trim() || 'Unknown Fighter 1',
          fighter2: data['Fighter 2']?.trim() || 'Unknown Fighter 2',
          result: data['Result']?.trim() || 'Unknown Result',
          KDs_fighter1: parseInt(data['KDs (Fighter 1)']) || 0,
          KDs_fighter2: parseInt(data['KDs (Fighter 2)']) || 0,
          STR_fighter1: parseInt(data['STR (Fighter 1)']) || 0,
          STR_fighter2: parseInt(data['STR (Fighter 2)']) || 0,
          TDs_fighter1: parseInt(data['TDs (Fighter 1)']) || 0,
          TDs_fighter2: parseInt(data['TDs (Fighter 2)']) || 0,
          Subs_fighter1: parseInt(data['Subs (Fighter 1)']) || 0,
          Subs_fighter2: parseInt(data['Subs (Fighter 2)']) || 0,
          weightClass: data['Weight Class']?.trim() || 'Unknown Weight Class',
          method: data['Method']?.trim() || 'Unknown Method',
          round: data['Round']?.trim() || 'Unknown Round',
          time: data['Time']?.trim() || 'Unknown Time',
        };
        fights.push(fightData);
      })
      .on('end', () => resolve(fights))
      .on('error', (error) => reject(error));
  });
}

function calculatePerformanceScore(fight: FightData, isFirstFighter: boolean): number {
  // Weight factors for different fight statistics
  const KD_WEIGHT = 5.0;    // Knockdowns are highly significant
  const STR_WEIGHT = 0.1;   // Significant strikes
  const TD_WEIGHT = 2.0;    // Takedowns
  const SUB_WEIGHT = 3.0;   // Submission attempts

  const kdsDiff = (fight.KDs_fighter1 - fight.KDs_fighter2) * (isFirstFighter ? 1 : -1);
  const strDiff = (fight.STR_fighter1 - fight.STR_fighter2) * (isFirstFighter ? 1 : -1);
  const tdsDiff = (fight.TDs_fighter1 - fight.TDs_fighter2) * (isFirstFighter ? 1 : -1);
  const subsDiff = (fight.Subs_fighter1 - fight.Subs_fighter2) * (isFirstFighter ? 1 : -1);

  // Normalize the performance score to be between -1 and 1
  return (kdsDiff * KD_WEIGHT + strDiff * STR_WEIGHT + tdsDiff * TD_WEIGHT + subsDiff * SUB_WEIGHT) / 100;
}

function getKFactor(fights: number, ratingDifference: number): number {
  // Base K-factor decreases with more fights
  const baseFactor = Math.max(MIN_K_FACTOR, MAX_K_FACTOR * Math.pow(K_FACTOR_DECAY, fights));
  
  // Adjust K-factor based on rating difference (bigger updates for unexpected results)
  const adjustmentFactor = 1 + Math.abs(ratingDifference) / 400;
  
  return Math.min(baseFactor * adjustmentFactor, MAX_K_FACTOR);
}

function getMethodBonus(method: string): number {
  // Bonus multiplier based on finish type
  if (method.toLowerCase().includes('ko') || method.toLowerCase().includes('tko')) {
    return 1.2;  // 20% bonus for knockouts
  } else if (method.toLowerCase().includes('submission')) {
    return 1.15;  // 15% bonus for submissions
  }
  return 1.0;  // No bonus for decisions
}

function updateRatings(fight: FightData, date: Date) {
  const fighter1 = fight.fighter1;
  const fighter2 = fight.fighter2;

  // Initialize fighter data if not present
  if (!fighterRatings[fighter1]) {
    fighterRatings[fighter1] = {
      rating: DEFAULT_RATING,
      peakRating: DEFAULT_RATING,
      fights: 0,
      lastFightDate: date,
      weightClasses: new Set([fight.weightClass]),
      ratingHistory: [DEFAULT_RATING]
    };
  }
  if (!fighterRatings[fighter2]) {
    fighterRatings[fighter2] = {
      rating: DEFAULT_RATING,
      peakRating: DEFAULT_RATING,
      fights: 0,
      lastFightDate: date,
      weightClasses: new Set([fight.weightClass]),
      ratingHistory: [DEFAULT_RATING]
    };
  }

  // Update weight classes
  fighterRatings[fighter1].weightClasses.add(fight.weightClass);
  fighterRatings[fighter2].weightClasses.add(fight.weightClass);

  const ratingA = fighterRatings[fighter1].rating;
  const ratingB = fighterRatings[fighter2].rating;

  // Calculate expected scores
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  // Determine actual outcome
  let scoreA: number;
  let scoreB: number;

  if (fight.result === fighter1) {
    scoreA = 1;
    scoreB = 0;
  } else if (fight.result === fighter2) {
    scoreA = 0;
    scoreB = 1;
  } else {
    scoreA = 0.5;
    scoreB = 0.5;
  }

  // Calculate performance scores
  const performanceA = calculatePerformanceScore(fight, true);
  const performanceB = calculatePerformanceScore(fight, false);

  // Get method bonus
  const methodBonus = getMethodBonus(fight.method);

  // Calculate K-factors
  const kFactorA = getKFactor(fighterRatings[fighter1].fights, ratingA - ratingB);
  const kFactorB = getKFactor(fighterRatings[fighter2].fights, ratingB - ratingA);

  // Update ratings
  const newRatingA = ratingA + kFactorA * ((scoreA + performanceA) - expectedA) * methodBonus;
  const newRatingB = ratingB + kFactorB * ((scoreB + performanceB) - expectedB) * methodBonus;

  // Update fighter data
  fighterRatings[fighter1].rating = newRatingA;
  fighterRatings[fighter2].rating = newRatingB;
  
  fighterRatings[fighter1].peakRating = Math.max(newRatingA, fighterRatings[fighter1].peakRating);
  fighterRatings[fighter2].peakRating = Math.max(newRatingB, fighterRatings[fighter2].peakRating);
  
  fighterRatings[fighter1].ratingHistory.push(newRatingA);
  fighterRatings[fighter2].ratingHistory.push(newRatingB);
  
  fighterRatings[fighter1].fights++;
  fighterRatings[fighter2].fights++;
  
  fighterRatings[fighter1].lastFightDate = date;
  fighterRatings[fighter2].lastFightDate = date;
}

async function writeRatingsToCSV(filePath: string, ratings: FighterRatings) {
  const sortedRatings = Object.entries(ratings)
    .sort(([, dataA], [, dataB]) => dataB.rating - dataA.rating)
    .map(([fighter, data]) => ({
      fighter,
      rating: data.rating.toFixed(2),
      peakRating: data.peakRating.toFixed(2),
      fights: data.fights,
      weightClasses: Array.from(data.weightClasses).join(', '),
      lastFight: data.lastFightDate.toISOString().split('T')[0],
      ratingHistory: data.ratingHistory.map(r => r.toFixed(2)).join(', ')
    }));

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'fighter', title: 'Fighter' },
      { id: 'rating', title: 'Current ELO Rating' },
      { id: 'peakRating', title: 'Peak ELO Rating' },
      { id: 'fights', title: 'Total Fights' },
      { id: 'weightClasses', title: 'Weight Classes' },
      { id: 'lastFight', title: 'Last Fight Date' },
      { id: 'ratingHistory', title: 'Rating History' }
    ],
  });

  await csvWriter.writeRecords(sortedRatings);
  console.log(`Fighter ratings written to ${filePath}`);
}

(async () => {
  try {
    // Read and sort fights chronologically
    const fights = await readCSV('../Scraper/ufc_fights.csv');
    fights.sort((a, b) => new Date(a.event).getTime() - new Date(b.event).getTime());

    // Process all fights
    for (const fight of fights) {
      const fightDate = new Date(fight.event);
      updateRatings(fight, fightDate);
    }

    // Export results
    await writeRatingsToCSV('fighter_ratings.csv', fighterRatings);

  } catch (error) {
    console.error('An error occurred:', error);
  }
})();