import { blue, purple } from "@mui/material/colors";
import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import axios from "axios";

function BarChart() {
  const [chartData, setChartData] = useState([
    ["Roll", "Registrerade", "Aktiva"],
    ["Kunder", 0, 0],
    ["Supporter", 0, 0],
    ["Administratörer", 0, 0],
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Material chart options
  const options = {
    chart: {
      title: "Användarstatistik",
      subtitle: "Registrerade och aktiva användare per roll",
    },
    colors: ["#f707ff", "#3700ff"], // Material colors
    hAxis: {
      title: "Antal",
    },
    vAxis: {
      title: "Roll",
    },
    legend: { position: "top" },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Hämta antalet registrerade användare
        const registeredResponse = await axios.get('/api/statistics/user-counts');
        
        
        // Konvertera API-svaret till Google Charts format
        const formattedData = [
          ["Roll", "Registrerade", "Aktiva"]
        ];
        
        // Översätt roller och skapa data med två mätvärden
        Object.entries(registeredResponse.data).forEach(([role, count]) => {
          const displayRole = 
            role === 'CUSTOMER' ? 'Kunder' : 
            role === 'SUPPORT' ? 'Supporter' : 
            role === 'ADMIN' ? 'Administratörer' : role;
          
          // För aktiva användare simulerar vi ett lägre antal än de registrerade
          // Ersätt detta med verklig data från ditt API
          const activeCount = Math.floor(count * 0.7); // 70% av de registrerade är aktiva
          
          formattedData.push([displayRole, count, activeCount]);
        });
        
        setChartData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Fel vid hämtning av data:", err);
        setError("Kunde inte hämta användarstatistik");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Laddar statistik...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Chart
      chartType="Bar"
      width="100%"
      height="650px"
      data={chartData}
      options={options}
    />
  );
}

export default BarChart;
