import { useState, useRef } from 'react';
import { Upload, Plus, Trash2, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { FileItem } from '@/types';

const CATEGORIES = ['Disease', 'Medicine', 'Lab'] as const;
type Category = typeof CATEGORIES[number];

type FileSections = Record<Category, FileItem[]>;

const emptyItem = (): FileItem => ({ file: null, description: '' });

function FileRow({
  item,
  index,
  onFileChange,
  onDescChange,
  onRemove,
  canRemove,
}: {
  item: FileItem;
  index: number;
  onFileChange: (i: number, file: File | null) => void;
  onDescChange: (i: number, desc: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 group">
      {/* File picker */}
      <div className="flex-1 min-w-0">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => onFileChange(index, e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full flex items-center gap-2 px-3 h-8 rounded-md border text-sm transition-all',
            item.file
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600',
          )}
        >
          {item.file ? (
            <><CheckCircle size={13} className="flex-shrink-0" /><span className="truncate">{item.file.name}</span></>
          ) : (
            <><Upload size={13} className="flex-shrink-0" /><span>Choose file…</span></>
          )}
        </button>
      </div>

      {/* Description */}
      <input
        type="text"
        placeholder="Description"
        value={item.description}
        onChange={(e) => onDescChange(index, e.target.value)}
        className="form-input w-48 flex-shrink-0"
      />

      {/* Remove */}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Remove row"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function FileUpload() {
  const { toast } = useToast();
  const [sections, setSections] = useState<FileSections>({
    Disease: [emptyItem()],
    Medicine: [emptyItem()],
    Lab: [emptyItem()],
  });
  const [uploading, setUploading] = useState(false);

  const updateItem = (cat: Category, index: number, patch: Partial<FileItem>) => {
    setSections((prev) => {
      const next = [...prev[cat]];
      next[index] = { ...next[index], ...patch };
      return { ...prev, [cat]: next };
    });
  };

  const addRow = (cat: Category) =>
    setSections((prev) => ({ ...prev, [cat]: [...prev[cat], emptyItem()] }));

  const removeRow = (cat: Category, index: number) =>
    setSections((prev) => ({ ...prev, [cat]: prev[cat].filter((_, i) => i !== index) }));

  const buildFormData = (): FormData => {
    const fd = new FormData();
    CATEGORIES.forEach((cat) => {
      sections[cat].forEach((item, i) => {
        if (item.file) {
          fd.append(`${cat}[${i}].File`, item.file);
          fd.append(`${cat}[${i}].FileDescription`, item.description || '');
        }
      });
    });
    return fd;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFiles = CATEGORIES.some((cat) => sections[cat].some((f) => f.file));
    if (!hasFiles) {
      toast('Please select at least one file to upload.', 'warning');
      return;
    }

    setUploading(true);
    try {
      const res = await fetch('http://localhost:5071/Submit', {
        method: 'POST',
        body: buildFormData(),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      toast('Files uploaded successfully!', 'success');
      setSections({ Disease: [emptyItem()], Medicine: [emptyItem()], Lab: [emptyItem()] });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const totalFiles = CATEGORIES.reduce(
    (acc, cat) => acc + sections[cat].filter((f) => f.file).length,
    0,
  );

  const footer = (
    <>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <FileText size={14} />
        <span>{totalFiles} file{totalFiles !== 1 ? 's' : ''} selected</span>
      </div>
      <Button type="submit" form="file-upload-form" disabled={uploading}>
        {uploading ? (
          <><Loader2 size={13} className="animate-spin" /> Uploading…</>
        ) : (
          <><Upload size={13} /> Upload All Files</>
        )}
      </Button>
    </>
  );

  return (
    <PageCard title="File Upload with Description" footer={footer}>
      <form id="file-upload-form" onSubmit={handleSubmit} className="space-y-6">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            {/* Category header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="section-badge">
                  <FileText size={11} /> {cat}
                </span>
                <span className="text-xs text-slate-400">
                  {sections[cat].filter((f) => f.file).length} / {sections[cat].length} selected
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addRow(cat)}
                className="text-xs h-7"
              >
                <Plus size={12} /> Add Row
              </Button>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {sections[cat].map((item, i) => (
                <FileRow
                  key={i}
                  item={item}
                  index={i}
                  onFileChange={(idx, file) => updateItem(cat, idx, { file })}
                  onDescChange={(idx, description) => updateItem(cat, idx, { description })}
                  onRemove={(idx) => removeRow(cat, idx)}
                  canRemove={sections[cat].length > 1}
                />
              ))}
            </div>
          </div>
        ))}
      </form>
    </PageCard>
  );
}
