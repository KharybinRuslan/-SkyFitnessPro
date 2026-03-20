import { createPortal } from "react-dom";
import styles from "./StartOverConfirmModal.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function StartOverConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: Props) {
  if (!isOpen) return null;

  const content = (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-over-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 id="start-over-title" className={styles.title}>
          Вы уверены, что хотите начать заново?
        </h2>
        <p className={styles.subtitle}>При подтверждении весь прогресс будет сброшен.</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Отменить
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Сброс…" : "Применить"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
