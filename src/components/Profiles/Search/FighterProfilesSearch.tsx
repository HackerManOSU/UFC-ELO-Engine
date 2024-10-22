import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FighterProfilesSearch: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchInput.trim()) {
      const formattedName = searchInput.toLowerCase().replace(/\s+/g, '-');
      navigate(`/FighterProfiles/${formattedName}`);
    }
  };

  return (
    <div className="fighter-search">
      <h1>Search for Fighter Profiles</h1>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Enter fighter's name"
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default FighterProfilesSearch;
