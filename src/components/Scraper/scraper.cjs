"use strict";
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
var axios_1 = require("axios");
var cheerio = require("cheerio");
var csv_writer_1 = require("csv-writer");
var BASE_URL = 'http://ufcstats.com';
function getCompletedEvents() {
    return __awaiter(this, void 0, void 0, function () {
        var events, page, _loop_1, state_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    events = [];
                    page = 1;
                    _loop_1 = function () {
                        var url, data, $, eventsOnPage;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    url = "".concat(BASE_URL, "/statistics/events/completed?page=").concat(page);
                                    console.log("Fetching events from page ".concat(page));
                                    return [4 /*yield*/, axios_1.default.get(url)];
                                case 1:
                                    data = (_b.sent()).data;
                                    $ = cheerio.load(data);
                                    eventsOnPage = 0;
                                    $('.b-statistics__table-events > tbody > tr').each(function (_, element) {
                                        var eventLink = $(element).find('a').attr('href');
                                        var eventName = $(element).find('a').text().trim();
                                        if (eventLink && eventName) {
                                            events.push({ name: eventName, link: eventLink });
                                            eventsOnPage++;
                                        }
                                    });
                                    if (eventsOnPage === 0) {
                                        console.log('No more events found. Exiting pagination.');
                                        return [2 /*return*/, "break"];
                                    }
                                    page++;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 3];
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/, events];
            }
        });
    });
}
/* Only first page - for testing

async function getCompletedEvents() {
  const events: { name: string; link: string }[] = [];
  const page = 1; // Always fetch only the first page

  const url = `${BASE_URL}/statistics/events/completed?page=${page}`;
  console.log(`Fetching events from page ${page}`);
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  $('.b-statistics__table-events > tbody > tr').each((_, element) => {
    const eventLink = $(element).find('a').attr('href');
    const eventName = $(element).find('a').text().trim();
    if (eventLink && eventName) {
      events.push({ name: eventName, link: eventLink });
    }
  });

  return events; // Return the events from the first page only
}
  */
function getFightsFromEvent(event) {
    return __awaiter(this, void 0, void 0, function () {
        var data, $, fights;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1.default.get(event.link)];
                case 1:
                    data = (_a.sent()).data;
                    $ = cheerio.load(data);
                    fights = [];
                    $('.b-fight-details__table-body > tr').each(function (_, element) {
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        var columns = $(element).find('td');
                        // const fighter1 = $(columns[1]).find('p').first().text().trim();
                        // const fighter2 = $(columns[1]).find('p').last().text().trim();
                        var fighter1Element = $(columns[1]).find('p').first();
                        var fighter2Element = $(columns[1]).find('p').last();
                        var fighter1 = fighter1Element.length > 0 ? fighter1Element.text().trim() : 'Unknown Fighter 1';
                        var fighter2 = fighter2Element.length > 0 ? fighter2Element.text().trim() : 'Unknown Fighter 2';
                        // Determining the result (win, loss, or draw)
                        var result = $(columns[0]).text().trim().toLowerCase();
                        var winner;
                        if (result.includes('win')) {
                            winner = fighter1;
                        }
                        else {
                            winner = 'Draw';
                        }
                        var KDs_fighter1 = parseInt(((_a = $(columns[2]).text().trim().match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || '0', 10);
                        var KDs_fighter2 = parseInt(((_b = $(columns[2]).text().trim().match(/\d+/g)) === null || _b === void 0 ? void 0 : _b[1]) || '0', 10);
                        var STR_fighter1 = parseInt(((_c = $(columns[3]).text().trim().match(/\d+/)) === null || _c === void 0 ? void 0 : _c[0]) || '0', 10);
                        var STR_fighter2 = parseInt(((_d = $(columns[3]).text().trim().match(/\d+/g)) === null || _d === void 0 ? void 0 : _d[1]) || '0', 10);
                        var TDs_fighter1 = parseInt(((_e = $(columns[4]).text().trim().match(/\d+/)) === null || _e === void 0 ? void 0 : _e[0]) || '0', 10);
                        var TDs_fighter2 = parseInt(((_f = $(columns[4]).text().trim().match(/\d+/g)) === null || _f === void 0 ? void 0 : _f[1]) || '0', 10);
                        var Subs_fighter1 = parseInt(((_g = $(columns[5]).text().trim().match(/\d+/)) === null || _g === void 0 ? void 0 : _g[0]) || '0', 10);
                        var Subs_fighter2 = parseInt(((_h = $(columns[5]).text().trim().match(/\d+/g)) === null || _h === void 0 ? void 0 : _h[1]) || '0', 10);
                        var weightClass = $(columns[6]).text().trim();
                        var method = $(columns[7]).text().trim();
                        var round = $(columns[8]).text().trim();
                        var time = $(columns[9]).text().trim();
                        fights.push({
                            event: event.name,
                            fighter1: fighter1,
                            fighter2: fighter2,
                            result: winner,
                            KDs_fighter1: KDs_fighter1,
                            KDs_fighter2: KDs_fighter2,
                            STR_fighter1: STR_fighter1,
                            STR_fighter2: STR_fighter2,
                            TDs_fighter1: TDs_fighter1,
                            TDs_fighter2: TDs_fighter2,
                            Subs_fighter1: Subs_fighter1,
                            Subs_fighter2: Subs_fighter2,
                            weightClass: weightClass,
                            method: method,
                            round: round,
                            time: time,
                        });
                    });
                    return [2 /*return*/, fights];
            }
        });
    });
}
function scrapeUFCData() {
    return __awaiter(this, void 0, void 0, function () {
        var events, allFights, _i, events_1, event_1, fights;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getCompletedEvents()];
                case 1:
                    events = _a.sent();
                    allFights = [];
                    _i = 0, events_1 = events;
                    _a.label = 2;
                case 2:
                    if (!(_i < events_1.length)) return [3 /*break*/, 5];
                    event_1 = events_1[_i];
                    console.log("Scraping event: ".concat(event_1.name));
                    return [4 /*yield*/, getFightsFromEvent(event_1)];
                case 3:
                    fights = _a.sent();
                    allFights.push.apply(allFights, fights);
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, allFights];
            }
        });
    });
}
function exportToCSV(fights) {
    return __awaiter(this, void 0, void 0, function () {
        var csvWriter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
                        path: 'ufc_fights.csv',
                        header: [
                            { id: 'event', title: 'Event' },
                            { id: 'fighter1', title: 'Fighter 1' },
                            { id: 'fighter2', title: 'Fighter 2' },
                            { id: 'result', title: 'Result' },
                            { id: 'KDs_fighter1', title: 'KDs (Fighter 1)' },
                            { id: 'KDs_fighter2', title: 'KDs (Fighter 2)' },
                            { id: 'STR_fighter1', title: 'STR (Fighter 1)' },
                            { id: 'STR_fighter2', title: 'STR (Fighter 2)' },
                            { id: 'TDs_fighter1', title: 'TDs (Fighter 1)' },
                            { id: 'TDs_fighter2', title: 'TDs (Fighter 2)' },
                            { id: 'Subs_fighter1', title: 'Subs (Fighter 1)' },
                            { id: 'Subs_fighter2', title: 'Subs (Fighter 2)' },
                            { id: 'weightClass', title: 'Weight Class' },
                            { id: 'method', title: 'Method' },
                            { id: 'round', title: 'Round' },
                            { id: 'time', title: 'Time' },
                        ],
                    });
                    return [4 /*yield*/, csvWriter.writeRecords(fights)];
                case 1:
                    _a.sent();
                    console.log('Data exported to ufc_fights.csv');
                    return [2 /*return*/];
            }
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var fights, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, scrapeUFCData()];
            case 1:
                fights = _a.sent();
                return [4 /*yield*/, exportToCSV(fights)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('An error occurred:', error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); })();
