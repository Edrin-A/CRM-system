import { useNavigate } from "react-router";
import Shape from '../assets/Shape.png'; // Lägg till denna import
import Button from '../Components/button'; // Importera Button-komponenten

export default function Firstpage() {
  const navigate = useNavigate();

  function handleOnCompany() {
    navigate("/godisfabrikenab");
  }

  function handleOnCompany2() {
    navigate("/sportab");
  }

  function handleOnHome() {
    navigate("/Home");
  }

  return (
    <div className='homeWrapper'>
      <div className='buttonWrapper-Layout'>
        <Button className='SigninButton-Layout' text="Logga in" onClick={handleOnHome} />
      </div>
      <div className='contentWrapper'>
        <div className='Logo'>
          <img src={Shape} alt='Shape' />
        </div>
        <h1 className='signup-title'>Välj företag</h1>      
        <div className='buttonWrapper-home'>
          <button onClick={handleOnCompany} className='SignupButton-signup'>
            Godisfabriken AB
          </button>
          <button onClick={handleOnCompany2} className='SignupButton-signup'>
            Sport AB
          </button>
        </div>
      </div>
    </div>
  );
}
