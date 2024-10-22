import React, { useState, useEffect } from 'react';
import './FighterRankingTable.css'

interface FighterData {
  Fighter: string;
  'Current ELO': number;
  'Peak ELO': number;
  'Number of Fights': number;
  'Average Performance': number;
  'Weight Classes': string;
}

const FighterRankingTable: React.FC = () => {
  const [fighters, setFighters] = useState<FighterData[]>([]);
  const [filteredFighters, setFilteredFighters] = useState<FighterData[]>([]);
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [weightClassFilter, setWeightClassFilter] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('Current ELO');

  // Load CSV data (assuming it is available in a JSON format for ease of use)
  useEffect(() => {
    fetch('/csvjson.json') // Replace with the correct path
      .then((response) => response.json())
      .then((data) => {
        setFighters(data);
        setFilteredFighters(data);
      });
  }, []);

  // Handle filtering based on gender and weight class
  useEffect(() => {
    let updatedFighters = [...fighters];

    if (genderFilter !== 'All') {
      updatedFighters = updatedFighters.filter(fighter => {
        if (genderFilter === 'Men') {
          return !fighter['Weight Classes'].includes("Women's");
        } else if (genderFilter === 'Women') {
          return fighter['Weight Classes'].includes("Women's");
        }
        return true;
      });
    }

    if (weightClassFilter !== 'All') {
      updatedFighters = updatedFighters.filter(fighter =>
        fighter['Weight Classes'].includes(weightClassFilter)
      );
    }

    // Handle sorting
    updatedFighters = updatedFighters.sort((a, b) => {
      if (sortOption === 'Current ELO') {
        return b['Current ELO'] - a['Current ELO'];
      } else if (sortOption === 'Peak ELO') {
        return b['Peak ELO'] - a['Peak ELO'];
      }
      return 0;
    });

    setFilteredFighters(updatedFighters);
  }, [genderFilter, weightClassFilter, sortOption, fighters]);

  return (
    <div className='m-8'>
      <h1 className='text-6xl font-bold'>Fighter Rankings</h1>

      {/* Gender Tabs */}
      <div className="tabs">
        <button 
          className={`tab-button ${genderFilter === 'All' ? 'active' : ''}`}
          onClick={() => setGenderFilter('All')}
        >
          All
        </button>
        <button 
          className={`tab-button ${genderFilter === 'Men' ? 'active' : ''}`}
          onClick={() => setGenderFilter('Men')}
        >
          Men's Rankings
        </button>
        <button 
          className={`tab-button ${genderFilter === 'Women' ? 'active' : ''}`}
          onClick={() => setGenderFilter('Women')}
        >
          Women's Rankings
        </button>
      </div>

      {/* Weight Class Filter */}
      <select value={weightClassFilter} onChange={(e) => setWeightClassFilter(e.target.value)}>
        <option value="All">Weight Class</option>
        <option value="Heavyweight">Heavyweight</option>
        <option value="Light Heavyweight">Light Heavyweight</option>
        <option value="Middleweight">Middleweight</option>
        <option value="Welterweight">Welterweight</option>
        <option value="Lightweight">Lightweight</option>
        <option value="Featherweight">Featherweight</option>
        <option value="Bantamweight">Bantamweight</option>
        <option value="Flyweight">Flyweight</option>
      </select>

      {/* Sort Option */}
      <label>Sort By: </label>
      <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
        <option value="Current ELO">Current ELO</option>
        <option value="Peak ELO">Peak ELO</option>
      </select>

      {/* Table Display */}
      <table>
        <thead>
          <tr>
            <th>Fighter</th>
            <th>Current ELO</th>
            <th>Peak ELO</th>
            <th>Number of Fights</th>
            <th>Weight Classes</th>
          </tr>
        </thead>
        <tbody>
          {filteredFighters.map((fighter) => (
            <tr key={fighter.Fighter}>
              <td>{fighter.Fighter}</td>
              <td className='text-center'>{fighter['Current ELO']}</td>
              <td className='text-center'>{fighter['Peak ELO']}</td>
              <td className='text-center'>{fighter['Number of Fights']}</td>
              <td>{fighter['Weight Classes']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FighterRankingTable;