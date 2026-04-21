import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-primary">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
