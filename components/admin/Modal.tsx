import Button from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm(): void;
  onCancel(): void;
  danger?: boolean;
}

export default function Modal({ open, title, description, onConfirm, onCancel, danger }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
