import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatProvider';

export function MessageInput() {
  const { sendMessage, setTyping, activeConversationId } = useChat();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const onChangeText = (e) => {
    setText(e.target.value);
    setTyping(true);
    // Simple debounce stop typing
    setTimeout(() => setTyping(false), 1200);
  };

  const onSend = async (e) => {
    if (e) e.preventDefault();
    if (!activeConversationId || !text.trim()) return;
    
    setSending(true);
    try {
      await sendMessage({ text: text.trim() });
      setText('');
    } catch (err) {
      console.error('[MessageInput] Send failed:', err);
    } finally {
      setSending(false);
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="message-input-container p-3 border-top bg-white">
      <form onSubmit={onSend}>
        <div className="d-flex gap-2 align-items-center">
          <div className="flex-fill">
            <textarea
              className="form-control"
              rows={1}
              placeholder={activeConversationId ? 'Type a message...' : 'Select a conversation first'}
              value={text}
              onChange={onChangeText}
              onKeyDown={handleKeyDown}
              disabled={!activeConversationId || sending}
              style={{ resize: 'none', minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button 
            type="submit"
            className="btn btn-primary btn-sm px-3" 
            disabled={sending || !activeConversationId || !text.trim()}
            style={{ height: '40px' }}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </form>
    </div>
  );
}
