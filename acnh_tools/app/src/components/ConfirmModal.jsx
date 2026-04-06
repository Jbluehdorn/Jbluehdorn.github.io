import './ConfirmModal.css'

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  if (!message) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-modal-buttons">
          <button className="confirm-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-modal-ok" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
