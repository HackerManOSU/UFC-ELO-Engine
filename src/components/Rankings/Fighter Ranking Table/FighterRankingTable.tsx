import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FighterRankingTable.css';

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
  const [weightClassFilter, setWeightClassFilter] = useState<Set<string>>(new Set(['All']));
  const [sortOption, setSortOption] = useState<string>('Current ELO');
  const [activeWeightClasses, setActiveWeightClasses] = useState<string[]>([]);

  const weightClasses = ['Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight', 'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight', "Women's Bantamweight", "Women's Flyweight", "Women's Strawweight"];
  const mensWeightClasses = ['Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight', 'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight'];
  const womensWeightClasses = ["Women's Bantamweight", "Women's Flyweight", "Women's Strawweight"];

  useEffect(() => {
    fetch('/csvjson.json') // Replace with the correct path
      .then((response) => response.json())
      .then((data) => {
        setFighters(data);
        setFilteredFighters(data);
      });
  }, []);

  // Update activeWeightClasses based on gender filter
  useEffect(() => {
    if (genderFilter === 'Men') {
      setActiveWeightClasses(mensWeightClasses);
    } else if (genderFilter === 'Women') {
      setActiveWeightClasses(womensWeightClasses);
    } else {
      setActiveWeightClasses(weightClasses);
    }
  }, [genderFilter]);

  // Handle filtering based on gender and weight class
  useEffect(() => {
    let updatedFighters = [...fighters];

    // Gender filter
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

    // Weight class filter
    if (!weightClassFilter.has('All')) {
      updatedFighters = updatedFighters.filter(fighter =>
        Array.from(weightClassFilter).some((wc) => {
          const isExactMatch = fighter['Weight Classes'].split(', ').some(className => className === wc);
          return isExactMatch;
        })
      );
    }

    // Sorting
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

  // Handle weight class selection (multi-select)
  const toggleWeightClass = (weightClass: string) => {
    const newFilter = new Set(weightClassFilter);

    if (weightClass === 'All') {
      // Reset to "All" when "All" is clicked
      setWeightClassFilter(new Set(['All']));
    } else {
      if (newFilter.has('All')) {
        newFilter.delete('All');
      }
      if (newFilter.has(weightClass)) {
        newFilter.delete(weightClass);
      } else {
        newFilter.add(weightClass);
      }
      setWeightClassFilter(newFilter);
    }
  };

  return (
    <div className='main m-8'>
      <h1 className='text-6xl font-black mb-4'>UFC Fighter Ratings</h1>

      {/* Gender Tabs */}
      <div className="tabs text-lg mb-4 flex">
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

      {/* Weight Class Tabs */}
      <div className="tabs-small text-smflex flex-wrap w-[100%]">
        <button 
          className={`tab-button-small px-4 py-2 mb-4 ${weightClassFilter.has('All') ? 'active' : ''}`}
          onClick={() => toggleWeightClass('All')}
        >
          All
        </button>
        {activeWeightClasses.map((weightClass) => (
          <button
            key={weightClass}
            className={`tab-button-small px-4 py-2 mb-4 ${weightClassFilter.has(weightClass) ? 'active' : ''}`}
            onClick={() => toggleWeightClass(weightClass)}
          >
            {weightClass}
          </button>
        ))}
      </div>

      {/* Sorting Tabs */}
      <div className="tabs-small mb-4 text-sm">
        <button
          className={`tab-button-small px-4 py-2 ${sortOption === 'Current ELO' ? 'active' : ''}`}
          onClick={() => setSortOption('Current ELO')}
        >
          Sort by Current ELO
        </button>
        <button
          className={`tab-button-small px-4 py-2 ${sortOption === 'Peak ELO' ? 'active' : ''}`}
          onClick={() => setSortOption('Peak ELO')}
        >
          Sort by Peak ELO
        </button>
      </div>

      {/* Table Display */}
      <div className='table-container'>

      <table className='table-container'>
        <thead className='font-thin'>
          <tr>
            <th>#</th>
            <th>Fighter</th>
            <th>Current ELO</th>
            <th>Peak ELO</th>
            <th>Number of Fights</th>
          </tr>
        </thead>
        <tbody className='font-semibold'>
          {filteredFighters.map((fighter, index) => (
            <tr key={fighter.Fighter}>
              <td className='text-center'>{index + 1}</td>
              <td>
                <Link className='hover:text-[#ff817e]' to={`/FighterProfiles/${fighter.Fighter.toLowerCase().replace(/\s+/g, '-')}`}>
                  {fighter.Fighter}
                </Link>
              </td>
              <td className='text-center'>{fighter['Current ELO']}</td>
              <td className='text-center'>{fighter['Peak ELO']}</td>
              <td className='text-center'>{fighter['Number of Fights']}</td>
            </tr>
          ))}
        </tbody>
      </table>

      </div>

    </div>
  );
};

export default FighterRankingTable;
