export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={`modal-overlay confirm-modal ${type}`} onClick={handleOverlayClick}>
      <div className="modal-content confirm-modal-content">
        <div className="confirm-icon">
          {type === 'danger' ? '⚠️' : '✅'}
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-buttons">
          <button onClick={onClose} className="btn-modal-cancel">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`btn-modal-confirm ${type}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
