import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Header from './components/Header/Header'
import FighterRankingTable from './components/Rankings/Fighter Ranking Table/FighterRankingTable'
import FighterProfilesSearch from './components/Profiles/Search/FighterProfilesSearch'
import FighterProfile from './components/Profiles/Individuals/FighterProfile'

function App() {

  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

  const toggleNavbar = () => {
    setIsNavbarOpen(!isNavbarOpen);
  };

  return (
    <Router>
      <div>

      <Header toggleNavbar={toggleNavbar}/>

        <Routes>


          <Route path="/" element={<FighterRankingTable/>} />
          <Route path="/FighterProfiles" element={<FighterProfilesSearch/>} />
          <Route path="/FighterProfiles/:fighterName" element={<FighterProfile/>} />


        </Routes>

      </div>



    </Router>
  )
}

export default App
