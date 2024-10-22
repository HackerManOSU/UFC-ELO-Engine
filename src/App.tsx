import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Header from './components/Header/Header'
import FighterRankingTable from './components/Rankings/Fighter Ranking Table/FighterRankingTable'

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

        </Routes>

      </div>



    </Router>
  )
}

export default App
