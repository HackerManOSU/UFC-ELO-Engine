import { parse } from 'csv-parse';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

interface FightData {
    Event: string;
    'Fighter 1': string;
    'Fighter 2': string;
    Result: string;
    'Weight Class': string;
    Method: string;
    'KDs (Fighter 1)': number;
    'KDs (Fighter 2)': number;
    'STR (Fighter 1)': number;
    'STR (Fighter 2)': number;
    'TDs (Fighter 1)': number;
    'TDs (Fighter 2)': number;
    'Subs (Fighter 1)': number;
    'Subs (Fighter 2)': number;
}

interface FighterRecord {
    name: string;
    elo: number;
    peakElo: number;
    fights: number;
    weightClasses: Set<string>;
    eloHistory: number[];
    performanceHistory: number[];
    avgPerformance: number;
}

class UFCEloEngine {
    private fighters: Map<string, FighterRecord> = new Map();
    private readonly INITIAL_ELO = 1000;
    private readonly K_FACTOR = 32;
    private readonly FINISH_BONUS = 0.1; // 10% bonus for finishes
    private readonly DATA_PATH = '../Scraper/ufc_fights.csv';
    private readonly OUTPUT_PATH = './fighter_elos.csv';

    constructor() {
        this.fighters = new Map();
    }

    private calculatePerformanceScore(fight: FightData, isFirstFighter: boolean): number {
        // Calculate performance score based on fight statistics
        const kdsDiff = (fight['KDs (Fighter 1)'] - fight['KDs (Fighter 2)']) * (isFirstFighter ? 1 : -1);
        const strDiff = (fight['STR (Fighter 1)'] - fight['STR (Fighter 2)']) * (isFirstFighter ? 1 : -1);
        const tdsDiff = (fight['TDs (Fighter 1)'] - fight['TDs (Fighter 2)']) * (isFirstFighter ? 1 : -1);
        const subsDiff = (fight['Subs (Fighter 1)'] - fight['Subs (Fighter 2)']) * (isFirstFighter ? 1 : -1);

        // Normalize the performance score
        return (kdsDiff * 5 + strDiff * 0.1 + tdsDiff * 2 + subsDiff * 3) / 100;
    }

    private getFinishBonus(method: string): number {
        const lowerMethod = method.toLowerCase();
        if (lowerMethod.includes('KO/TKO') || lowerMethod.includes('SUB')) {
            return this.FINISH_BONUS;
        }
        return 0;
    }

    private initializeFighter(name: string, weightClass: string): FighterRecord {
        if (!this.fighters.has(name)) {
            this.fighters.set(name, {
                name,
                elo: this.INITIAL_ELO,
                peakElo: this.INITIAL_ELO,
                fights: 0,
                weightClasses: new Set([weightClass]),
                eloHistory: [this.INITIAL_ELO],
                performanceHistory: [],
                avgPerformance: 0
            });
        } else {
            this.fighters.get(name)?.weightClasses.add(weightClass);
        }
        return this.fighters.get(name)!;
    }

    private calculateEloChange(winnerElo: number, loserElo: number, performanceScore: number, finishBonus: number): number {
        const expectedScore = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
        const baseChange = this.K_FACTOR * (1 - expectedScore);
        
        // Apply performance multiplier and finish bonus
        const performanceMultiplier = 1 + performanceScore;
        const totalMultiplier = performanceMultiplier * (1 + finishBonus);
        
        const eloChange = Math.round(baseChange * totalMultiplier);

        return Math.min(Math.max(eloChange, -50), 50);

    }

    private updateElos(winner: FighterRecord, loser: FighterRecord, fight: FightData) {
        const isWinnerFighter1 = fight['Fighter 1'] === winner.name;
        const winnerPerformance = this.calculatePerformanceScore(fight, isWinnerFighter1);
        const finishBonus = this.getFinishBonus(fight.Method);
        
        const eloChange = this.calculateEloChange(winner.elo, loser.elo, winnerPerformance, finishBonus);
        
        winner.elo += eloChange;
        loser.elo -= eloChange;
        
        winner.peakElo = Math.max(winner.peakElo, winner.elo);
        loser.peakElo = Math.max(loser.peakElo, loser.elo);
        
        winner.fights++;
        loser.fights++;
        
        winner.performanceHistory.push(winnerPerformance);
        loser.performanceHistory.push(-winnerPerformance);
        
        winner.avgPerformance = winner.performanceHistory.reduce((a, b) => a + b, 0) / winner.performanceHistory.length;
        loser.avgPerformance = loser.performanceHistory.reduce((a, b) => a + b, 0) / loser.performanceHistory.length;
        
        winner.eloHistory.push(winner.elo);
        loser.eloHistory.push(loser.elo);
    }

    private handleDraw(fighter1: FighterRecord, fighter2: FighterRecord, fight: FightData) {
        const performance1 = this.calculatePerformanceScore(fight, true);
        const expectedScore1 = 1 / (1 + Math.pow(10, (fighter2.elo - fighter1.elo) / 400));
        const eloChange = Math.round(this.K_FACTOR * (0.5 - expectedScore1) * (1 + performance1));
        
        fighter1.elo += eloChange;
        fighter2.elo -= eloChange;
        
        fighter1.peakElo = Math.max(fighter1.peakElo, fighter1.elo);
        fighter2.peakElo = Math.max(fighter2.peakElo, fighter2.elo);
        
        fighter1.fights++;
        fighter2.fights++;
        
        fighter1.performanceHistory.push(performance1);
        fighter2.performanceHistory.push(-performance1);
        
        fighter1.avgPerformance = fighter1.performanceHistory.reduce((a, b) => a + b, 0) / fighter1.performanceHistory.length;
        fighter2.avgPerformance = fighter2.performanceHistory.reduce((a, b) => a + b, 0) / fighter2.performanceHistory.length;
        
        fighter1.eloHistory.push(fighter1.elo);
        fighter2.eloHistory.push(fighter2.elo);
    }

    async processHistoricalData(): Promise<void> {
      return new Promise((resolve, reject) => {
          const fights: FightData[] = [];
          const dataFilePath = path.resolve(__dirname, this.DATA_PATH);
          
          if (!fs.existsSync(dataFilePath)) {
              console.error(`File not found: ${dataFilePath}`);
              reject(new Error(`File not found: ${dataFilePath}`));
              return;
          }
          
          fs.createReadStream(dataFilePath)
              .pipe(parse({ columns: true }))
              .on('data', (row) => fights.push(row))
              .on('end', () => {
                  fights.sort((a, b) => a.Event.localeCompare(b.Event));
                  
                  for (const fight of fights) {
                      const fighter1 = this.initializeFighter(fight['Fighter 1'], fight['Weight Class']);
                      const fighter2 = this.initializeFighter(fight['Fighter 2'], fight['Weight Class']);
                      
                      if (fight.Result === 'Draw') {
                          this.handleDraw(fighter1, fighter2, fight);
                      } else {
                          const winner = fight.Result === fight['Fighter 1'] ? fighter1 : fighter2;
                          const loser = fight.Result === fight['Fighter 1'] ? fighter2 : fighter1;
                          this.updateElos(winner, loser, fight);
                      }
                  }
                  
                  this.exportResults()
                      .then(() => resolve())
                      .catch(reject);
              })
              .on('error', reject);
      });
  }
  

    private async exportResults(): Promise<void> {
        const csvWriter = createObjectCsvWriter({
            path: this.OUTPUT_PATH,
            header: [
                { id: 'name', title: 'Fighter' },
                { id: 'elo', title: 'Current ELO' },
                { id: 'peakElo', title: 'Peak ELO' },
                { id: 'fights', title: 'Number of Fights' },
                { id: 'avgPerformance', title: 'Average Performance' },
                { id: 'weightClasses', title: 'Weight Classes' },
                { id: 'eloHistory', title: 'ELO History' },
                { id: 'performanceHistory', title: 'Performance History' }
            ]
        });

        const records = Array.from(this.fighters.values()).map(fighter => ({
            ...fighter,
            weightClasses: Array.from(fighter.weightClasses).join(', '),
            eloHistory: fighter.eloHistory.join(', '),
            performanceHistory: fighter.performanceHistory.join(', '),
            avgPerformance: fighter.avgPerformance.toFixed(3)
        }));

        await csvWriter.writeRecords(records);
    }
}

// Execute the ELO calculations
const eloEngine = new UFCEloEngine();
eloEngine.processHistoricalData()
    .then(() => console.log('ELO calculations completed and exported to CSV'))
    .catch(error => console.error('Error processing fight data:', error));