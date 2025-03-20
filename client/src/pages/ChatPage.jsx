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
  const [ticketStatus, setTicketStatus] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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
      const response = await fetch(`/api/chat/${chatToken}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setTicketStatus(data.ticket_status);
        setTicketId(data.ticket_id);

        // Kontrollera om feedback redan har skickats
        if (data.ticket_status === 'STÄNGD') {
          const feedbackResponse = await fetch(`/api/feedback/exists/${data.ticket_id}`);
          if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            if (feedbackData.exists) {
              setFeedbackSubmitted(true);
            }
          }
        }
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
      const response = await fetch(`/api/chat/${chatToken}/message`, {
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
      } else {
        // Hantera fel, till exempel om ärendet är stängt
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Hjälpfunktion för att avgöra om ett meddelande är från support/admin
  const isStaffMessage = (senderType) => {
    return senderType === 'ADMIN' || senderType === 'SUPPORT';
  };

  // Hantera feedback-formuläret
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticketId,
          rating: rating,
          comment: comment
        })
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Renderingslogik för chatten eller feedbackformulär
  const renderContent = () => {
    if (ticketStatus === 'STÄNGD') {
      if (feedbackSubmitted) {
        return (
          <div className="feedback-thanks">
            <h3>Tack för din feedback!</h3>
            <p>Vi uppskattar din återkoppling och använder den för att förbättra vår service.</p>
          </div>
        );
      } else {
        return (
          <div className="feedback-form">
            <h3>Hur upplevde du vår kundtjänst?</h3>
            <p>Betygsätt din upplevelse och hjälp oss att förbättra vår service.</p>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="rating-container">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rating-btn ${rating === value ? 'selected' : ''}`}
                    onClick={() => setRating(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="feedback-comment">
                <label htmlFor="comment">Kommentar (valfritt):</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Berätta mer om din upplevelse..."
                />
              </div>
              <button type="submit" className="submit-feedback-btn">
                Skicka feedback
              </button>
            </form>
          </div>
        );
      }
    } else {
      // Visa vanliga chattgränssnittet
      return (
        <>
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
        </>
      );
    }
  };

  return (
    <>
      <Navbar />
      <Box height={110} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '80%', maxWidth: '800px' }}>
          <div className="chat-container">
            {ticketStatus === 'STÄNGD' && (
              <div className="ticket-closed-banner">
                <p>Detta ärende är stängt.</p>
              </div>
            )}

            {renderContent()}
          </div>
        </Box>
      </Box>
    </>
  );
}
