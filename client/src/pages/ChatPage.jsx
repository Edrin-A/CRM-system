import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Box from '@mui/material/Box';
import { GlobalContext } from "../GlobalContext.jsx";

export default function ChatPage() {
  const { chatToken } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useContext(GlobalContext);

  /**
   * Hämtar meddelandehistorik för den aktuella chatten
   * Anropas vid komponentladdning och efter att nya meddelanden skickats
   * för att hålla konversationen uppdaterad
   */
  useEffect(() => {
    fetchMessages();
    // Uppdaterar meddelanden var 5:e sekund för att visa nya meddelanden
    // utan att användaren behöver uppdatera sidan
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chatToken]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${chatToken}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  /**
   * Hanterar inskickning av nya meddelanden
   * Inkluderar användarens roll för att korrekt visa meddelanden från olika användartyper
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Använd senderType och skicka användarens roll om inloggad
      const response = await fetch(`/api/messages/${chatToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          senderType: user?.role || 'USER'  // Använd user.role från GlobalContext
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Hjälpfunktion för att avgöra om ett meddelande är från support/admin
  const isStaffMessage = (senderType) => {
    return senderType === 'ADMIN' || senderType === 'SUPPORT';
  };

  return (
    <>
      <Navbar />
      <Box height={110} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '80%', maxWidth: '800px' }}>
          <div className="chat-container">
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${isStaffMessage(msg.sender_type) ? 'staff-message' : 'user-message'}`}
                >
                  <div className="message-content">{msg.message_text}</div>
                  <div className="message-time">
                    {msg.sender_type} - {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Skriv ditt meddelande här..."
                className="message-input"
              />
              <button type="submit" className="send-button-ChatPage">Skicka</button>
            </form>
          </div>
        </Box>
      </Box>
    </>
  );
}
