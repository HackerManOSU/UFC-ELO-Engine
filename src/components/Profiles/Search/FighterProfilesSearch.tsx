import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './fighterprofilesearch.css'

const FighterProfilesSearch: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchInput.trim()) {
      const formattedName = searchInput.toLowerCase().replace(/\s+/g, '-');
      navigate(`/FighterProfiles/${formattedName}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fighter-search h-screen w-screen flex justify-center">

      <div className='h-[25%] min-h-[150px] mt-[100px] w-[90%] flex flex-col items-center text-center justify-evenly'>

        <h1 className='text-5xl font-bold mb-4'>Search for Fighter Profiles</h1>
        
        <div className='flex flex-col items-center w-[100%]'>

          <input
            className='w-[50%] min-w-[300px] max-w-[750px] h-[45px] rounded-md border-4 border-[#d40101]'
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Fighter's Name"
          />
          <button className='bg-[#d40101] px-8 py-2 mt-4 rounded-md text-white hover:bg-[#ff817e]' onClick={handleSearch}>Search</button>

          </div>


      </div>

    </div>
  );
};

export default FighterProfilesSearch;
