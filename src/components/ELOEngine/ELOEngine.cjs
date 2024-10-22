"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var csv_parse_1 = require("csv-parse");
var csv_writer_1 = require("csv-writer");
var fs = require("fs");
var path = require("path");
var UFCEloEngine = /** @class */ (function () {
    function UFCEloEngine() {
        this.fighters = new Map();
        this.INITIAL_ELO = 1000;
        this.K_FACTOR = 32;
        this.FINISH_BONUS = 0.1; // 10% bonus for finishes
        this.DATA_PATH = '../Scraper/ufc_fights.csv';
        this.OUTPUT_PATH = './fighter_elos.csv';
        this.fighters = new Map();
    }
    UFCEloEngine.prototype.calculatePerformanceScore = function (fight, isFirstFighter) {
        // Calculate performance score based on fight statistics
        var kdsDiff = (fight['KDs (Fighter 1)'] - fight['KDs (Fighter 2)']) * (isFirstFighter ? 1 : -1);
        var strDiff = (fight['STR (Fighter 1)'] - fight['STR (Fighter 2)']) * (isFirstFighter ? 1 : -1);
        var tdsDiff = (fight['TDs (Fighter 1)'] - fight['TDs (Fighter 2)']) * (isFirstFighter ? 1 : -1);
        var subsDiff = (fight['Subs (Fighter 1)'] - fight['Subs (Fighter 2)']) * (isFirstFighter ? 1 : -1);
        // Normalize the performance score
        return (kdsDiff * 5 + strDiff * 0.1 + tdsDiff * 2 + subsDiff * 3) / 100;
    };
    UFCEloEngine.prototype.getFinishBonus = function (method) {
        var lowerMethod = method.toLowerCase();
        if (lowerMethod.includes('KO/TKO') || lowerMethod.includes('SUB')) {
            return this.FINISH_BONUS;
        }
        return 0;
    };
    UFCEloEngine.prototype.initializeFighter = function (name, weightClass) {
        var _a;
        if (!this.fighters.has(name)) {
            this.fighters.set(name, {
                name: name,
                elo: this.INITIAL_ELO,
                peakElo: this.INITIAL_ELO,
                fights: 0,
                weightClasses: new Set([weightClass]),
                eloHistory: [this.INITIAL_ELO],
                performanceHistory: [],
                avgPerformance: 0
            });
        }
        else {
            (_a = this.fighters.get(name)) === null || _a === void 0 ? void 0 : _a.weightClasses.add(weightClass);
        }
        return this.fighters.get(name);
    };
    UFCEloEngine.prototype.calculateEloChange = function (winnerElo, loserElo, performanceScore, finishBonus) {
        var expectedScore = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
        var baseChange = this.K_FACTOR * (1 - expectedScore);
        // Apply performance multiplier and finish bonus
        var performanceMultiplier = 1 + performanceScore;
        var totalMultiplier = performanceMultiplier * (1 + finishBonus);
        var eloChange = Math.round(baseChange * totalMultiplier);
        return Math.min(Math.max(eloChange, -50), 50);
    };
    UFCEloEngine.prototype.updateElos = function (winner, loser, fight) {
        var isWinnerFighter1 = fight['Fighter 1'] === winner.name;
        var winnerPerformance = this.calculatePerformanceScore(fight, isWinnerFighter1);
        var finishBonus = this.getFinishBonus(fight.Method);
        var eloChange = this.calculateEloChange(winner.elo, loser.elo, winnerPerformance, finishBonus);
        winner.elo += eloChange;
        loser.elo -= eloChange;
        winner.peakElo = Math.max(winner.peakElo, winner.elo);
        loser.peakElo = Math.max(loser.peakElo, loser.elo);
        winner.fights++;
        loser.fights++;
        winner.performanceHistory.push(winnerPerformance);
        loser.performanceHistory.push(-winnerPerformance);
        winner.avgPerformance = winner.performanceHistory.reduce(function (a, b) { return a + b; }, 0) / winner.performanceHistory.length;
        loser.avgPerformance = loser.performanceHistory.reduce(function (a, b) { return a + b; }, 0) / loser.performanceHistory.length;
        winner.eloHistory.push(winner.elo);
        loser.eloHistory.push(loser.elo);
    };
    UFCEloEngine.prototype.handleDraw = function (fighter1, fighter2, fight) {
        var performance1 = this.calculatePerformanceScore(fight, true);
        var expectedScore1 = 1 / (1 + Math.pow(10, (fighter2.elo - fighter1.elo) / 400));
        var eloChange = Math.round(this.K_FACTOR * (0.5 - expectedScore1) * (1 + performance1));
        fighter1.elo += eloChange;
        fighter2.elo -= eloChange;
        fighter1.peakElo = Math.max(fighter1.peakElo, fighter1.elo);
        fighter2.peakElo = Math.max(fighter2.peakElo, fighter2.elo);
        fighter1.fights++;
        fighter2.fights++;
        fighter1.performanceHistory.push(performance1);
        fighter2.performanceHistory.push(-performance1);
        fighter1.avgPerformance = fighter1.performanceHistory.reduce(function (a, b) { return a + b; }, 0) / fighter1.performanceHistory.length;
        fighter2.avgPerformance = fighter2.performanceHistory.reduce(function (a, b) { return a + b; }, 0) / fighter2.performanceHistory.length;
        fighter1.eloHistory.push(fighter1.elo);
        fighter2.eloHistory.push(fighter2.elo);
    };
    UFCEloEngine.prototype.processHistoricalData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var fights = [];
                        var dataFilePath = path.resolve(__dirname, _this.DATA_PATH);
                        if (!fs.existsSync(dataFilePath)) {
                            console.error("File not found: ".concat(dataFilePath));
                            reject(new Error("File not found: ".concat(dataFilePath)));
                            return;
                        }
                        fs.createReadStream(dataFilePath)
                            .pipe((0, csv_parse_1.parse)({ columns: true }))
                            .on('data', function (row) { return fights.push(row); })
                            .on('end', function () {
                            fights.sort(function (a, b) { return a.Event.localeCompare(b.Event); });
                            for (var _i = 0, fights_1 = fights; _i < fights_1.length; _i++) {
                                var fight = fights_1[_i];
                                var fighter1 = _this.initializeFighter(fight['Fighter 1'], fight['Weight Class']);
                                var fighter2 = _this.initializeFighter(fight['Fighter 2'], fight['Weight Class']);
                                if (fight.Result === 'Draw') {
                                    _this.handleDraw(fighter1, fighter2, fight);
                                }
                                else {
                                    var winner = fight.Result === fight['Fighter 1'] ? fighter1 : fighter2;
                                    var loser = fight.Result === fight['Fighter 1'] ? fighter2 : fighter1;
                                    _this.updateElos(winner, loser, fight);
                                }
                            }
                            _this.exportResults()
                                .then(function () { return resolve(); })
                                .catch(reject);
                        })
                            .on('error', reject);
                    })];
            });
        });
    };
    UFCEloEngine.prototype.exportResults = function () {
        return __awaiter(this, void 0, void 0, function () {
            var csvWriter, records;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
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
                        records = Array.from(this.fighters.values()).map(function (fighter) { return (__assign(__assign({}, fighter), { weightClasses: Array.from(fighter.weightClasses).join(', '), eloHistory: fighter.eloHistory.join(', '), performanceHistory: fighter.performanceHistory.join(', '), avgPerformance: fighter.avgPerformance.toFixed(3) })); });
                        return [4 /*yield*/, csvWriter.writeRecords(records)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return UFCEloEngine;
}());
// Execute the ELO calculations
var eloEngine = new UFCEloEngine();
eloEngine.processHistoricalData()
    .then(function () { return console.log('ELO calculations completed and exported to CSV'); })
    .catch(function (error) { return console.error('Error processing fight data:', error); });
