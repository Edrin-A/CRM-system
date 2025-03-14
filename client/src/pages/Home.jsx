import React from 'react';
import { useNavigate } from 'react-router';
import Button from '../Components/button';
import Shape from '../assets/Shape.png';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna

const Home = () => {
  const navigate = useNavigate();

  
  function handleOnSignIn() {
    navigate("/signin");
  }

  return (
    <div className='homeWrapper'>
      <div className='contentWrapper'>
        <div className='Logo-home'>
          <img src={Shape} alt='Shape' />
        </div>
        <div className='buttonWrapper-home'>
          <Button className='SigninButton-home' text="Sign In" onClick={handleOnSignIn} />
        </div>
      </div>
    </div>
  );
};

export default Home;

