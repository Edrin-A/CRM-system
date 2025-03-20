// i denna admin.jsx filen så implementerar vi ett administratörsgränssnitt för att 
//  skapa nya supportanvändare. Komponenten hanterar formulärinmatning,den gär en API-anrop för att 
//  skapa användare och skicka bekräftelsemail, samt visar ett bekräftelsemeddelande efter lyckad registrering.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import Shape from '../assets/Shape.png';
import AddSupportUsers from '../Components/AddSupportUsers';
import ManageSupportUsers from '../Components/ManageSupportUsers';
import ManageProducts from '../Components/ManageProducts';

export default function Admin() {
  // State för att hålla reda på aktiv vy
  const [activeView, setActiveView] = useState("menu"); // "menu", "addSupport", "manageSupport", "manageProducts"
  const navigate = useNavigate();

  // Funktion för att återgå till huvudmenyn
  const goBackToMenu = () => {
    setActiveView("menu");
  };

  // Funktion för att navigera tillbaka till homes
  const goBackToMainMenu = () => {
    navigate('/homes');
  };

  // Returnerar JSX för att rendera komponenten
  return (
    <div className='homeWrapper'>
      {activeView === "menu" ? (
        // Huvudmenyn med tre val
        <div className="admin-menu formWrapper">
          <div className='Logo-Layout'>
            <img src={Shape} alt='Shape' />
          </div>
          <h2>Administratörspanel</h2>

          {/* Centrerad tillbaka-knapp med ny CSS-klass */}
          <div className="centered-button-container">
            <button
              className="BackButton-Centered"
              onClick={goBackToMainMenu}
            >
              Tillbaka till huvudmenyn
            </button>
          </div>

          <div className="menu-buttons">
            <button
              className='MenuButton-Layout'
              onClick={() => setActiveView("addSupport")}
            >
              Lägg till kundtjänstmedarbetare
            </button>
            <button
              className='MenuButton-Layout'
              onClick={() => setActiveView("manageSupport")}
            >
              Hantera kundtjänstmedarbetare
            </button>
            <button
              className='MenuButton-Layout'
              onClick={() => setActiveView("manageProducts")}
            >
              Hantera produkter/tjänster
            </button>
          </div>
        </div>
      ) : activeView === "addSupport" ? (
        <AddSupportUsers goBackToMenu={goBackToMenu} />
      ) : activeView === "manageSupport" ? (
        <ManageSupportUsers goBackToMenu={goBackToMenu} />
      ) : activeView === "manageProducts" ? (
        <ManageProducts goBackToMenu={goBackToMenu} />
      ) : null}
    </div>
  );
}