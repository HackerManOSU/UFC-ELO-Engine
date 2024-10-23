import axios from 'axios';
import * as cheerio from 'cheerio';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';

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

const BASE_URL = 'http://ufcstats.com';

async function getCompletedEvents() {
  const events: { name: string; link: string }[] = [];
  let page = 1;

  while (true) {
    const url = `${BASE_URL}/statistics/events/completed?page=${page}`;
    console.log(`Fetching events from page ${page}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let eventsOnPage = 0;

    $('.b-statistics__table-events > tbody > tr').each((_, element) => {
      const eventLink = $(element).find('a').attr('href');
      const eventName = $(element).find('a').text().trim();
      if (eventLink && eventName) {
        events.push({ name: eventName, link: eventLink });
        eventsOnPage++;
      }
    });

    if (eventsOnPage === 0) {
      console.log('No more events found. Exiting pagination.');
      break;
    }

    page++;
  }

  return events;
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

async function getFightsFromEvent(event: { name: string; link: string }) {
  const { data } = await axios.get(event.link);
  const $ = cheerio.load(data);

  const fights: FightData[] = [];

  $('.b-fight-details__table-body > tr').each((_, element) => {
    const columns = $(element).find('td');

    // const fighter1 = $(columns[1]).find('p').first().text().trim();
    // const fighter2 = $(columns[1]).find('p').last().text().trim();

    const fighter1Element = $(columns[1]).find('p').first();
    const fighter2Element = $(columns[1]).find('p').last();
    
    const fighter1 = fighter1Element.length > 0 ? fighter1Element.text().trim() : 'Unknown Fighter 1';
    const fighter2 = fighter2Element.length > 0 ? fighter2Element.text().trim() : 'Unknown Fighter 2';
    

    // Determining the result (win, loss, or draw)
    const result = $(columns[0]).text().trim().toLowerCase();
    let winner: string;
    if (result.includes('win')) {
      winner = fighter1;
    } else {
      winner = 'Draw';
    }

    const KDs_fighter1 = parseInt($(columns[2]).text().trim().match(/\d+/)?.[0] || '0', 10);
    const KDs_fighter2 = parseInt($(columns[2]).text().trim().match(/\d+/g)?.[1] || '0', 10);

    const STR_fighter1 = parseInt($(columns[3]).text().trim().match(/\d+/)?.[0] || '0', 10);
    const STR_fighter2 = parseInt($(columns[3]).text().trim().match(/\d+/g)?.[1] || '0', 10);
    
    const TDs_fighter1 = parseInt($(columns[4]).text().trim().match(/\d+/)?.[0] || '0', 10);
    const TDs_fighter2 = parseInt($(columns[4]).text().trim().match(/\d+/g)?.[1] || '0', 10);
    
    const Subs_fighter1 = parseInt($(columns[5]).text().trim().match(/\d+/)?.[0] || '0', 10);
    const Subs_fighter2 = parseInt($(columns[5]).text().trim().match(/\d+/g)?.[1] || '0', 10);

    const weightClass = $(columns[6]).text().trim();

    const method = $(columns[7]).text().trim();
    
    const round = $(columns[8]).text().trim();
    
    const time = $(columns[9]).text().trim();

    fights.push({
      event: event.name,
      fighter1,
      fighter2,
      result: winner,
      KDs_fighter1,
      KDs_fighter2,
      STR_fighter1,
      STR_fighter2,
      TDs_fighter1,
      TDs_fighter2,
      Subs_fighter1,
      Subs_fighter2,
      weightClass,
      method,
      round,
      time,
    });
  });

  return fights;
}

async function scrapeUFCData() {
  const events = await getCompletedEvents();
  const allFights: FightData[] = [];

  for (const event of events) {
    console.log(`Scraping event: ${event.name}`);
    const fights = await getFightsFromEvent(event);
    allFights.push(...fights);
  }

  return allFights;
}

async function exportToCSV(fights: FightData[]) {
  const csvWriter = createCsvWriter({
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

  await csvWriter.writeRecords(fights);
  console.log('Data exported to ufc_fights.csv');
}

(async () => {
  try {
    const fights = await scrapeUFCData();
    await exportToCSV(fights);
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
