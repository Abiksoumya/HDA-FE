// import { X, Save, Search } from 'lucide-react';
// import { Button } from '@/components/ui/Button';
// import { usePageButtons } from '@/hooks/usePageButtons';
// import { cn } from '@/utils/cn';

// interface DynamicFooterProps {
//   formId?: string;
//   saving?: boolean;
//   onClose?: () => void;
//   onSubmit?: () => void;
//   onSearch?: () => void;
//   className?: string;
// }

// export default function DynamicFooter({
//   formId,
//   saving = false,
//   onClose,
//   onSubmit,
//   onSearch,
//   className,
// }: DynamicFooterProps) {
//   const buttons = usePageButtons();

//   return (
//     <div className={cn('flex justify-end gap-2', className)}>
//       {buttons.includes('Search') && onSearch && (
//         <Button variant="outline" type="button" onClick={onSearch}>
//           <Search size={13} /> Search
//         </Button>
//       )}
//       {buttons.includes('Close') && (
//         <Button variant="secondary" type="button" onClick={onClose}>
//           <X size={13} /> Close
//         </Button>
//       )}
//       {buttons.includes('Submit') && (
//         <Button
//           type={formId ? 'submit' : 'button'}
//           form={formId}
//           onClick={!formId ? onSubmit : undefined}
//           disabled={saving}
//         >
//           <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
//         </Button>
//       )}
//     </div>
//   );
// }
import { X, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePageButtons } from '@/hooks/usePageButtons';
import { cn } from '@/utils/cn';

interface DynamicFooterProps {
  formId?: string;
  saving?: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
  onSearch?: () => void;
  hideSubmit?: boolean;
  className?: string;
}

export default function DynamicFooter({
  formId,
  saving = false,
  onClose,
  onSubmit,
  onSearch,
  hideSubmit = false,
  className,
}: DynamicFooterProps) {
  const buttons = usePageButtons();

  return (
    <div className={cn('flex justify-end gap-2', className)}>
      {buttons.includes('Search') && onSearch && (
        <Button variant="outline" type="button" onClick={onSearch}>
          <Search size={13} /> Search
        </Button>
      )}
      {buttons.includes('Close') && (
        <Button variant="secondary" type="button" onClick={onClose}>
          <X size={13} /> Close
        </Button>
      )}
      {buttons.includes('Submit') && !hideSubmit && (
        <Button
          type={formId ? 'submit' : 'button'}
          form={formId}
          onClick={!formId ? onSubmit : undefined}
          disabled={saving}
        >
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      )}
    </div>
  );
}