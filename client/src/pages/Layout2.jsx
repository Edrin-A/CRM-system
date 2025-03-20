import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Button from '../Components/button';
import '../index.css';
import Shape from '../assets/Shape.png';

export default function Layout() {
  const navigate = useNavigate();
  const [company] = useState("Sport AB"); // Förinställt till "Sport AB" och kan inte ändras
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // States för produkter
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  
  // Konstant företags-ID för Sport AB
  const sportAbId = "2"; // Anta att Sport AB har ID 2, ändra till rätt ID

  // Hämta produkter för Sport AB när komponenten laddas
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(`/api/companies/${sportAbId}/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }

    fetchProducts();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      // Skicka formulärdata till backend
      const formResponse = await fetch('/api/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Company: company,
          Email: email,
          Subject: subject,
          Message: message,
          ProductId: selectedProductId
        })
      });

      if (formResponse.ok) {
        // Hämta chat_token från svaret
        const formData = await formResponse.json();
        const chatToken = formData.chatToken;

        // Skapa chat-URL
        const chatUrl = `${window.location.origin}/chat/${chatToken}`;

        // Hitta produktnamnet
        const selectedProduct = products.find(p => p.id.toString() === selectedProductId);
        const productName = selectedProduct ? selectedProduct.name : "";

        // Skicka bekräftelsemail med chat-länk
        const emailResponse = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            To: email,
            Subject: "Bekräftelse på din förfrågan",
            Body: `
              <h2>Tack för din förfrågan!</h2>
              <p>Vi har mottagit ditt ärende och återkommer inom 24 timmar.</p>
              <p>Dina uppgifter:</p>
              <ul>
                <li>Företag: ${company}</li>
                <li>Produkt: ${productName}</li>
                <li>Ämne: ${subject}</li>
                <li>Meddelande: ${message}</li>
              </ul>
              <p>Klicka på länken nedan för att följa och svara på ditt ärende:</p>
              <a href="${chatUrl}">Följ ditt ärende här</a>
            `
          })
        });

        if (emailResponse.ok) {
          setIsSubmitted(true);
          // Återställ formuläret
          setEmail("");
          setSubject("");
          setMessage("");
          setSelectedProductId("");
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Något gick fel vid inskickning av formuläret');
    }
  }

  return (
    <div className='homeWrapper'>
      <form onSubmit={handleSubmit} className='formWrapper'>
        <div className='Logo-Layout'>
          <img src={Shape} alt='Shape' />
        </div>
        {isSubmitted ? (
          <div className="success-message">
            <h3>Du har nu skickat in ditt ärende!</h3>
            <p>Kolla din e-post för bekräftelse.</p>
          </div>
        ) : (
          <>
            <div className='formGroup'>
              <label htmlFor='company'>Företag:</label>
              <input
                type='text'
                id='company'
                value={company}
                readOnly
                className='readonly-input'
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='product'>Välj produkt:</label>
              <select
                id='product'
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                <option value=''>Välj en produkt</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='formGroup'>
              <label htmlFor='email'>Email:</label>
              <input
                type='email'
                id='email'
                placeholder='Skriv email...'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='subject'>Ämne:</label>
              <input
                className='form-subject'
                id='subject'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='message'>Meddelande:</label>
              <textarea
                className='form-meddelande'
                id='message'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <Button className='SendButton-Layout' text="Skicka in" type="submit" />
          </>
        )}
      </form>
    </div>
  );
}