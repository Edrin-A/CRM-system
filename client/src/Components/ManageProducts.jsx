// Komponent för att hantera produkter och tjänster för företag
import { useState, useEffect } from 'react';
import Shape from '../assets/Shape.png';

export default function ManageProducts({ goBackToMenu }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State för att hantera nytt produktformulär
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");

  // State för att hantera redigering av produkter
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Hämta företag när komponenten laddas
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
          if (data.length > 0) {
            setSelectedCompanyId(data[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError('Kunde inte hämta företag');
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  // Hämta produkter när ett företag väljs
  useEffect(() => {
    if (!selectedCompanyId) {
      setProducts([]);
      return;
    }

    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch(`/api/companies/${selectedCompanyId}/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          setError('Kunde inte hämta produkter');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Ett fel uppstod vid hämtning av produkter');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCompanyId]);

  // Funktion för att lägga till en ny produkt
  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/companies/${selectedCompanyId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: newProductName,
          Description: newProductDescription
        })
      });

      if (response.ok) {
        const newProduct = await response.json();
        setProducts([...products, newProduct]);

        // Återställ formulär
        setNewProductName("");
        setNewProductDescription("");
        setIsAddingProduct(false);
      } else {
        alert('Kunde inte lägga till produkten');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Ett fel uppstod vid tillägg av produkten');
    }
  };

  // Funktion för att förbereda redigering av produkt
  const handleEditStart = (product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description);
  };

  // Funktion för att avbryta redigering
  const handleEditCancel = () => {
    setEditingProduct(null);
    setEditName("");
    setEditDescription("");
  };

  // Funktion för att spara redigerad produkt
  const handleEditSave = async () => {
    try {
      const response = await fetch(`/api/companies/${selectedCompanyId}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: editName,
          Description: editDescription
        })
      });

      if (response.ok) {
        const updatedProduct = await response.json();

        // Uppdatera produktlistan
        setProducts(products.map(product =>
          product.id === editingProduct.id ? updatedProduct : product
        ));

        // Återställ redigeringsläge
        handleEditCancel();
      } else {
        alert('Kunde inte uppdatera produkten');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ett fel uppstod vid uppdatering av produkten');
    }
  };

  // Funktion för att ta bort en produkt
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Är du säker på att du vill ta bort denna produkt?')) {
      try {
        const response = await fetch(`/api/companies/${selectedCompanyId}/products/${productId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Ta bort produkten från listan
          setProducts(products.filter(product => product.id !== productId));
        } else {
          alert('Kunde inte ta bort produkten');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ett fel uppstod vid borttagning av produkten');
      }
    }
  };

  return (
    <div className='formWrapper'>
      <div className='Logo-Layout'>
        <img src={Shape} alt='Shape' />
      </div>

      <button type="button" className="BackButton-Layout" onClick={goBackToMenu}>
        Tillbaka till menyn
      </button>

      <h2>Hantera produkter/tjänster</h2>

      {/* Företagsväljare */}
      <div className='formGroup'>
        <label htmlFor='companySelect'>Välj företag:</label>
        <select
          id='companySelect'
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
          <option value="">Välj företag</option>
          {companies.map(company => (
            <option key={company.id} value={company.id.toString()}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCompanyId && (
        <>
          {/* Lägg till ny produkt-knapp */}
          {!isAddingProduct && (
            <button
              type="button"
              className="AddButton-Layout"
              onClick={() => setIsAddingProduct(true)}
            >
              Lägg till ny produkt/tjänst
            </button>
          )}

          {/* Formulär för att lägga till produkt */}
          {isAddingProduct && (
            <div className="add-product-form">
              <h3>Lägg till ny produkt/tjänst</h3>
              <form onSubmit={handleAddProduct}>
                <div className='formGroup'>
                  <label htmlFor='productName'>Namn:</label>
                  <input
                    type='text'
                    id='productName'
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                  />
                </div>

                <div className='formGroup'>
                  <label htmlFor='productDescription'>Beskrivning:</label>
                  <textarea
                    id='productDescription'
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="button-group">
                  <button type="submit" className="SaveButton-Layout">
                    Lägg till
                  </button>
                  <button
                    type="button"
                    className="CancelButton-Layout"
                    onClick={() => setIsAddingProduct(false)}
                  >
                    Avbryt
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Redigeringsformulär */}
          {editingProduct && (
            <div className="edit-product-form">
              <h3>Redigera produkt/tjänst</h3>
              <div className='formGroup'>
                <label htmlFor='editProductName'>Namn:</label>
                <input
                  type='text'
                  id='editProductName'
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className='formGroup'>
                <label htmlFor='editProductDescription'>Beskrivning:</label>
                <textarea
                  id='editProductDescription'
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                />
              </div>

              <div className="button-group">
                <button type="button" className="SaveButton-Layout" onClick={handleEditSave}>
                  Spara
                </button>
                <button type="button" className="CancelButton-Layout" onClick={handleEditCancel}>
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Lista med produkter */}
          {loading ? (
            <p>Laddar produkter...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="products-list">
              <h3>Produkter/tjänster</h3>

              {products.length === 0 ? (
                <p>Inga produkter eller tjänster hittades för detta företag.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>Beskrivning</th>
                      <th>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.description}</td>
                        <td>
                          <button
                            type="button"
                            className="EditButton-Table"
                            onClick={() => handleEditStart(product)}
                          >
                            Redigera
                          </button>
                          <button
                            type="button"
                            className="DeleteButton-Table"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Ta bort
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
