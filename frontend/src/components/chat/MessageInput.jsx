import React, { useState } from 'react';
import { useChat } from '../../context/ChatProvider';

export function MessageInput() {
  const { sendMessage, setTyping, activeConversationId } = useChat();
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  const onChangeText = (e) => {
    setText(e.target.value);
    setTyping(true);
    // Simple debounce stop typing
    setTimeout(() => setTyping(false), 1200);
  };

  const onSelectFiles = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const onSend = async (e) => {
    e.preventDefault();
    if (!activeConversationId || (!text.trim() && files.length === 0)) return;
    setSending(true);
    try {
      await sendMessage({ text: text.trim(), files });
      setText('');
      setFiles([]);
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSend} className="d-flex flex-column gap-2">
      <textarea
        className="form-control"
        rows={2}
        placeholder={activeConversationId ? 'Type a message...' : 'Select a conversation first'}
        value={text}
        onChange={onChangeText}
        disabled={!activeConversationId || sending}
      />
      <input
        type="file"
        multiple
        onChange={onSelectFiles}
        className="form-control"
        disabled={!activeConversationId || sending}
      />
      {files.length > 0 && (
        <div className="small text-muted">{files.length} attachment(s) selected</div>
      )}
      <div className="d-flex justify-content-end">
        <button className="btn btn-primary btn-sm" disabled={sending || !activeConversationId}>Send</button>
      </div>
    </form>
  );
}
