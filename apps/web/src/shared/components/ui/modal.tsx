import { cn } from '@/shared/utils/cn';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({ open, onOpenChange, children, className, showCloseButton = true }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-2xl max-h-[90vh] overflow-y-auto',
            'bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl',
            'focus:outline-none',
            className,
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {showCloseButton && (
            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { Dialog };
