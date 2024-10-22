import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './fighterprofile.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface FighterData {
  Fighter: string;
  'Current ELO': number;
  'Peak ELO': number;
  'Number of Fights': number;
  'Average Performance': number;
  'Weight Classes': string;
  'ELO History': string;
  'Performance History': string;
}

const FighterProfile: React.FC = () => {
  const { fighterName } = useParams(); // Get fighter name from the URL
  const [fighterData, setFighterData] = useState<FighterData | null>(null);

  useEffect(() => {
    // Fetch fighter data based on fighterName
    fetch('/csvjson.json')
      .then((response) => response.json())
      .then((data: FighterData[]) => {
        const fighter = data.find(f => f.Fighter.toLowerCase().replace(/\s+/g, '-') === fighterName);
        setFighterData(fighter || null);
      });
  }, [fighterName]);

  if (!fighterData) {
    return <div>No fighter exists with that data.</div>;
  }

  // ELO History chart setup
  const eloHistory = fighterData['ELO History'].split(', ').map(Number);
  const chartData = {
    labels: eloHistory.map((_, index) => `${index + 1}`),
    datasets: [
      {
        label: 'ELO Rating Over Time',
        data: eloHistory,
        fill: false,
        borderColor: '#d40101',
        tension: 0.1,
      },
    ],
  };

  const performanceHistory = fighterData['Performance History'].split(', ').map((value: string) => parseFloat(value).toFixed(2)); // Round to 2 decimals

  return (
    <div className="fighter-profile m-12">

      <div className='flex flex-col md:flex-row-reverse items-center max-w-[1200px] justify-between'>

      <div>
          <img src="/FighterPlaceholder.png" alt="" className='max-w-[350px]'/>
        </div>

        <div className=''>

          <h1 className='text-5xl font-bold mb-4 text-center md:text-left'>{fighterData.Fighter}</h1>
          <div className="fighter-stats">
            <p><strong>Current ELO:</strong> {fighterData['Current ELO']}</p>
            <p><strong>Peak ELO:</strong> {fighterData['Peak ELO']}</p>
            <p><strong>Number of Fights:</strong> {fighterData['Number of Fights']}</p>
            <p><strong>Average Performance:</strong> {fighterData['Average Performance']}</p>
            <p><strong>Weight Classes:</strong> {fighterData['Weight Classes']}</p>
          </div>

        </div>

      </div>


      <div className="elo-history mt-12 text-3xl font-bold">
        <h2>ELO History</h2>
        <Line data={chartData} />
      </div>

      <div className="performance-history">
        <h2><strong>Performance History</strong></h2>
        <p>{performanceHistory.join(', ')}</p>
      </div>
    </div>
  );
}

export default FighterProfile;
