import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Button from '../Components/button';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna
import Shape from '../assets/Shape.png'; // Lägg till denna import

export default function Layout() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Ny state för bekräftelsemeddelande

  // Nya states för företag och produkter
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  // Hämta alla företag när komponenten laddas
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    }

    fetchCompanies();
  }, []);

  // Hämta produkter när ett företag väljs
  useEffect(() => {
    async function fetchProducts() {
      if (!selectedCompanyId) {
        setProducts([]);
        return;
      }

      try {
        const response = await fetch(`/api/companies/${selectedCompanyId}/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }

    fetchProducts();
  }, [selectedCompanyId]);

  function handleOnHome() {
    navigate("/Home");
  }

  // Hantera företagsval
  function handleCompanyChange(e) {
    const companyId = e.target.value;
    setSelectedCompanyId(companyId);

    // Hitta företagsnamnet baserat på ID
    const selectedCompany = companies.find(c => c.id.toString() === companyId);
    setCompany(selectedCompany ? selectedCompany.name : "");

    // Återställ produktvalet
    setSelectedProductId("");
  }

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
          ProductId: selectedProductId // Lägg till produktID
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
          setCompany("");
          setEmail("");
          setSubject("");
          setMessage("");
          setSelectedCompanyId("");
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
      <div className='buttonWrapper-Layout'>
        <Button className='SigninButton-Layout' text="Sign In" onClick={handleOnHome} />
      </div>
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
              <label htmlFor='company'>Välj företag:</label>
              <select
                id='company'
                value={selectedCompanyId}
                onChange={handleCompanyChange}
                required
              >
                <option value=''>Välj ett företag</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='formGroup'>
              <label htmlFor='product'>Välj produkt:</label>
              <select
                id='product'
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                disabled={!selectedCompanyId}
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
              <label htmlFor='email'>Gmail:</label>
              <input
                type='email'
                id='email'
                placeholder='Skriv gmail...'
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
              <input
                className='form-medelande'
                id='message'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button className='SendButton-Layout' text="Skicka in" type="submit" />
          </>
        )}
      </form>
    </div>
  );
}

