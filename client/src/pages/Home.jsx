import { useNavigate } from 'react-router-dom';
import Button from '../Components/button';
import Shape from '../assets/Shape.png';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna

const Home = () => {
  const navigate = useNavigate();

  function handleOnSignUp() {
    navigate("/signup");
  }

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
          <Button className='SigninButton-home' text="Logga in" onClick={handleOnSignIn} />
          <Button className='SignupButton' text="Skapa konto" onClick={handleOnSignUp} />
        </div>
      </div>
    </div>
  );
};

export default Home;