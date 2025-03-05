import React from 'react'
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna 
import { useNavigate } from 'react-router';
import Shape from '../assets/Shape.png'; // Lägg till denna import

const Signin = () => {

  const navigate = useNavigate();

  function HandleOnRegister() {
    navigate("/homes");
  }


  return (
    <div className='homeWrapper'>
      <div className='contentWrapper'>
        <div className='Logo'>
          <img src={Shape} alt='Shape' />
        </div>
        <div className='formWrapper'>
          <h1 className='signup-title'>Sign In</h1>
          <input type='email' placeholder='Email' className='inputField' />
          <input type='password' placeholder='Password' className='inputField' />
          <button className='SignupButton-signup' onClick={HandleOnRegister}>Logga in</button>
        </div>
      </div>
    </div>
  );
};

export default Signin;
