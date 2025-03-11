import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Box from '@mui/material/Box';

export default function ChatPage() {
  const { chatToken } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Hämta meddelanden
  useEffect(() => {
    fetchMessages();
    // Uppdatera meddelanden var 5:e sekund
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/messages/${chatToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <>
      <Navbar />
      <Box height={30} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '80%', maxWidth: '800px' }}>
          <div className="chat-container">
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_type.toLowerCase()}`}
                >
                  <div className="message-content">{msg.message_text}</div>
                  <div className="message-time">
                    {new Date(msg.created_at).toLocaleString()}
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
