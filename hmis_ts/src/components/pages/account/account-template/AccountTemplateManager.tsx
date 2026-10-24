import { useEffect, useState, useMemo } from 'react';
import { Save, X, Loader2,Plus } from 'lucide-react';
import {
  getAccountTemplates,
  getSubLedgerTypes,
  getSubLedgerAccountTemplate,
  getSubLedgerByAccountId,
  getAccountTemplateMaps,
  createAccountTemplateMap,
} from '@/apis/finance/financeApi';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface GLAccount {
  AccountID: number;
  AccountParentID: number;
  Code: string;
  Description: string;
  AccountType: string;
  GLSLFlag: string;
}
// interface StagedItem {
//   SLAccountID: number;      // GL AccountID
//   SLAccountCode: string;    // GL Code
//   SLAccountName: string;    // GL Description
//   SubLedgerTypeID: number;
//   Categories: {
//     SubLedgerID: number;
//     SubLedgerCode: string;
//     SubLedgerDescription: string;
//   }[];
// }

interface StagedItem {
  SLAccountID: number;
  SLAccountCode: string;
  SLAccountName: string;
  SubLedgerTypeID: number;
  isNew: boolean; // ← track if newly added during edit
  Categories: {
    SubLedgerID: number;
    SubLedgerCode: string;
    SubLedgerDescription: string;
    isNew: boolean; // ← track if newly added category
  }[];
}

interface SubLedgerType { SubLedgerTypeID: number; SubLedgerType: string; }
interface SLAccountMapped { AccountID: number; AccountCode: string; AccountName: string; }
interface SubLedgerItem { SubLedgerID: number; SubLedgerCode: string; SubLedgerDescription: string; }
interface TemplateRow { TemplateID: number; TemplateName: string; }

export default function AccountTemplateManager() {
  const { toast } = useToast();

  // Form state
  const [templateId, setTemplateId] = useState(0);
  const [templateName, setTemplateName] = useState('');

  // Step 1 — GL Accounts (top)
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [selectedGLIds, setSelectedGLIds] = useState<Set<number>>(new Set());

  // Step 2 — GL Wise Sub Ledger (bottom-left)
  const [subLedgerTypes, setSubLedgerTypes] = useState<SubLedgerType[]>([]);
  const [glSlAccountsByType, setGlSlAccountsByType] = useState<Record<number, SLAccountMapped[]>>({});
  const [selectedTypeId, setSelectedTypeId] = useState(0);
  const [selectedSLAccountId, setSelectedSLAccountId] = useState(0);

  // Step 3 — Category (bottom-right)
  const [categoryItems, setCategoryItems] = useState<SubLedgerItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Template list
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  
const [mappedGLAccountIds, setMappedGLAccountIds] = useState<Set<number>>(new Set());
const [mappedSLAccountIds, setMappedSLAccountIds] = useState<Set<number>>(new Set());
  const [deletedItems, setDeletedItems] = useState<StagedItem[]>([]);
  const [originalGLIds, setOriginalGLIds] = useState<Set<number>>(new Set());
  // Load GL accounts + Sub Ledger Types on mount
  useEffect(() => {
    Promise.all([
      getAccountTemplates(0, 0, 'N').then((r) => {
        const all = r?.data?.AccountList ?? [];
        // Top table — only GLSLFlag='Y' accounts
        setGlAccounts(all);
      }),
      getSubLedgerTypes().then((r) =>
        setSubLedgerTypes(r?.data?.SubLedgerTypeList ?? [])
      ),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load template list
useEffect(() => {
  setListLoading(true);
  getAccountTemplateMaps(0,  1, 20) // ← TemplateID=0 gets all
    .then((r) => setTemplates(r?.data?.Template ?? []))
    .catch(() => setTemplates([]))
    .finally(() => setListLoading(false));
}, [listKey]);

  // When GL accounts are checked/unchecked → load their sub ledger type mappings
 useEffect(() => {
  if (selectedGLIds.size === 0) {
    setGlSlAccountsByType({});
    setSelectedTypeId(0);
    setSelectedSLAccountId(0);
    setCategoryItems([]);
    setSelectedCategoryIds(new Set());
    return;
  }

  const promises = Array.from(selectedGLIds).map((id) =>
    getSubLedgerByAccountId(id) // ← use correct API
      .then((r) => {
        const slAccount = r?.data?.SLAccount;
        console.log('SLAccount for ID', id, ':', slAccount);
        return { accountId: id, data: slAccount };
      })
      .catch(() => ({ accountId: id, data: null }))
  );

  Promise.all(promises).then((results) => {
    const byType: Record<number, SLAccountMapped[]> = {};
    results.forEach(({ accountId, data }) => {
      if (!data) return;
      const typeId = data?.SubLedgerTypeID ?? 0;
      if (!typeId) return;
      if (!byType[typeId]) byType[typeId] = [];
      byType[typeId].push({
        AccountID: accountId,
        AccountCode: data?.AccountCode ?? '',
        AccountName: data?.AccountName ?? '',
      });
    });
    console.log('By type:', byType);
    setGlSlAccountsByType(byType);
  });
}, [selectedGLIds]);

  // When Sub Ledger Type radio selected → load category items
  useEffect(() => {
    if (!selectedTypeId || !selectedSLAccountId) {
      setCategoryItems([]);
      setSelectedCategoryIds(new Set());
      return;
    }

    setCategoryLoading(true);
    getSubLedgerByAccountId(selectedSLAccountId)
      .then((r) => {
        setCategoryItems(r?.data?.SLAccount?.SubLedger ?? []);
        setSelectedCategoryIds(new Set());
      })
      .catch(() => setCategoryItems([]))
      .finally(() => setCategoryLoading(false));
  }, [selectedSLAccountId]);

// Load already mapped accounts on mount
useEffect(() => {
  getAccountTemplateMaps(0, 1, 20)
    .then((r) => {
      const templates = r?.data?.Template ?? [];
      
      // Collect all mapped GL Account IDs across all templates
      const mappedGL = new Set<number>();
      const mappedSL = new Set<number>();
      
      templates.forEach((t: any) => {
        (t.GLAccounts ?? []).forEach((a: { AccountID: number; AccountIsMapped: boolean }) => {
          if (a.AccountIsMapped) mappedGL.add(a.AccountID);
        });
        (t.GLSLAccounts ?? []).forEach((a: { SLAccountID: number }) => {
          mappedSL.add(a.SLAccountID);
        });
      });

      setMappedGLAccountIds(mappedGL);
      setMappedSLAccountIds(mappedSL);
      setTemplates(templates);
    })
    .catch(() => {})
    .finally(() => setListLoading(false));
}, [listKey]);

  // Visible sub ledger types — only those mapped to checked GL accounts
//   const visibleTypes = useMemo(() =>
//     subLedgerTypes.filter((t) => glSlAccountsByType[t.SubLedgerTypeID]?.length > 0),
//     [subLedgerTypes, glSlAccountsByType]
//   );
// Remove visibleTypes memo and replace with:
const visibleGLSLAccounts = useMemo(() =>
  glAccounts.filter((a) => selectedGLIds.has(a.AccountID) && a.GLSLFlag === 'Y'),
  [glAccounts, selectedGLIds]
);

  const toggleGL = (id: number) => {
    setSelectedGLIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // Reset downstream selections
    setSelectedTypeId(0);
    setSelectedSLAccountId(0);
    setCategoryItems([]);
    setSelectedCategoryIds(new Set());
  };

  const toggleAllGL = (checked: boolean) => {
    setSelectedGLIds(checked ? new Set(glAccounts.map((a) => a.AccountID)) : new Set());
    setSelectedTypeId(0);
    setSelectedSLAccountId(0);
    setCategoryItems([]);
    setSelectedCategoryIds(new Set());
  };

  const handleTypeSelect = (typeId: number) => {
    setSelectedTypeId(typeId);
    setSelectedSLAccountId(0);
    setCategoryItems([]);
    setSelectedCategoryIds(new Set());

    // Auto-select first GL account for this type
    const accounts = glSlAccountsByType[typeId] ?? [];
    if (accounts.length > 0) {
      setSelectedSLAccountId(accounts[0].AccountID);
    }
  };

  const handleReset = () => {
    setTemplateId(0);
    setTemplateName('');
    setSelectedGLIds(new Set());
    setGlSlAccountsByType({});
    setSelectedTypeId(0);
    setSelectedSLAccountId(0);
    setCategoryItems([]);
    setSelectedCategoryIds(new Set());
    setStagedItems([]); // ← add
    setDeletedItems([]); // ← add
    setOriginalGLIds(new Set()); // ← add


  };
  const handleSubmit = async () => {
  if (!templateName.trim()) {
    toast('Template Name is required.', 'error');
    return;
  }
  if (stagedItems.length === 0) {
    toast('Please add at least one GL Wise Sub Ledger mapping.', 'error');
    return;
  }

  setSaving(true);
    try {
        const isEdit = templateId > 0; // ← edit mode check

    const payload = {
  RecordState: isEdit ? 2 : 1,
  TemplateID: templateId ?? 0,
  TemplateName: templateName,
  GLAccounts: Array.from(selectedGLIds).map((id) => ({
  RecordState: isEdit
    ? (originalGLIds.has(id) ? 2 : 1) // ← 2 for existing, 1 for new
    : 1,
  GLAccountID: id,
})),
  GLSLAccounts: [
  ...stagedItems.map((item) => ({
    RecordState: item.isNew ? 1 : (isEdit ? 2 : 1),
    SLAccountParentID: item.SLAccountID,
    SLAccounts: item.Categories.map((cat) => ({
      RecordState: cat.isNew ? 1 : (isEdit ? 2 : 1),
      SLAccountID: cat.SubLedgerID,
    })),
  })),
  ...deletedItems.map((item) => ({
    RecordState: 3,
    SLAccountParentID: item.SLAccountID,
    SLAccounts: item.Categories.map((cat) => ({
      RecordState: 3,
      SLAccountID: cat.SubLedgerID,
    })),
  })),
],
};

    console.log('Submit payload:', JSON.stringify(payload, null, 2));
    await createAccountTemplateMap(payload);
    toast(`Template ${templateId ? 'updated' : 'created'} successfully!`, 'success');
    handleReset();
    setListKey((k) => k + 1);
  } catch (err: unknown) {
    toast(err instanceof Error ? err.message : 'Failed to save template.', 'error');
  } finally {
    setSaving(false);
  }
};

const handleEdit = async (row: TemplateRow) => {
  try {
    const res = await getAccountTemplateMaps(row.TemplateID,  1, 20);
    const data = res?.data?.Template?.[0];
    if (!data) return;

   

    setTemplateId(data.TemplateID);
    setTemplateName(data.TemplateName);

    // Pre-select GL accounts where AccountIsMapped = true
    const mappedGLIds = new Set<number>(
      data.GLAccounts
        .filter((a: { AccountIsMapped: boolean }) => a.AccountIsMapped)
        .map((a: { AccountID: number }) => a.AccountID)
    );
    setSelectedGLIds(mappedGLIds);
    setOriginalGLIds(new Set(mappedGLIds)); // ← store originals

    // Build staged items
    const staged: StagedItem[] = (data.GLSLAccounts ?? []).map((item: {
  SLAccountID: number;
  SLAccountCode: string;
  SLAccount: string;
  SLAccounts: { SLAccountID: number; SLCode: string; SLAccount: string; }[];
}) => ({
  SLAccountID: item.SLAccountID,
  SLAccountCode: item.SLAccountCode,
  SLAccountName: item.SLAccount,
  SubLedgerTypeID: 0,
  isNew: false, // ← existing record
  Categories: item.SLAccounts.map((s) => ({
    SubLedgerID: s.SLAccountID,
    SubLedgerCode: s.SLCode,
    SubLedgerDescription: s.SLAccount,
    isNew: false, // ← existing record
  })),
}));

    setStagedItems(staged);
    setDeletedItems([]); // ← add after setStagedItems(staged)

    // ← Auto-select first staged item to pre-populate bottom section
    if (staged.length > 0) {
      const first = staged[0];
      setSelectedSLAccountId(first.SLAccountID);

      // Load category items for first staged item
      setCategoryLoading(true);
      getSubLedgerByAccountId(first.SLAccountID)
        .then((r) => {
          const slAccount = r?.data?.SLAccount;
          setSelectedTypeId(slAccount?.SubLedgerTypeID ?? 0);
          setCategoryItems(slAccount?.SubLedger ?? []);
          // Pre-check the categories that were already staged
          const stagedCatIds = new Set<number>(
            first.Categories.map((c) => c.SubLedgerID)
          );
          setSelectedCategoryIds(stagedCatIds);
        })
        .catch(() => setCategoryItems([]))
        .finally(() => setCategoryLoading(false));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch {
    toast('Failed to load template.', 'error');
  }
  };
  const handleAddStaged = () => {
  if (!selectedSLAccountId || selectedCategoryIds.size === 0) {
    toast('Please select a GL Wise Sub Ledger and at least one Category item.', 'error');
    return;
  }

  const glAccount = glAccounts.find((a) => a.AccountID === selectedSLAccountId);
  const selectedCategories = categoryItems.filter((c) =>
    selectedCategoryIds.has(c.SubLedgerID)
  );

  setStagedItems((prev) => {
    const existingIndex = prev.findIndex((s) => s.SLAccountID === selectedSLAccountId);

    if (existingIndex !== -1) {
      // ← Replace categories for this row (user editing existing staged item)
      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        Categories: selectedCategories.map((c) => ({
          ...c,
          // Keep isNew: false for originally existing, true for newly added
          isNew: !updated[existingIndex].Categories.find(
            (existing) => existing.SubLedgerID === c.SubLedgerID && !existing.isNew
          ),
        })),
      };
      return updated;
    } else {
      // ← New row
      return [...prev, {
        SLAccountID: selectedSLAccountId,
        SLAccountCode: glAccount?.Code ?? '',
        SLAccountName: glAccount?.Description ?? '',
        SubLedgerTypeID: selectedTypeId,
        isNew: true,
        Categories: selectedCategories.map((c) => ({
          ...c,
          isNew: true,
        })),
      }];
    }
  });

  // Reset
  setSelectedSLAccountId(0);
  setSelectedTypeId(0);
  setCategoryItems([]);
  setSelectedCategoryIds(new Set());
};
//   const handleAddStaged = () => {
//   if (!selectedSLAccountId || selectedCategoryIds.size === 0) {
//     toast('Please select a GL Wise Sub Ledger and at least one Category item.', 'error');
//     return;
//   }

//   const glAccount = glAccounts.find((a) => a.AccountID === selectedSLAccountId);
//   const selectedCategories = categoryItems.filter((c) =>
//     selectedCategoryIds.has(c.SubLedgerID)
//   );

//   setStagedItems((prev) => {
//     const existingIndex = prev.findIndex((s) => s.SLAccountID === selectedSLAccountId);

//     if (existingIndex !== -1) {
//       // Merge into existing row — new categories marked isNew: true
//       const updated = [...prev];
//       const existingCatIds = new Set(updated[existingIndex].Categories.map((c) => c.SubLedgerID));
//       const newCategories = selectedCategories
//         .filter((c) => !existingCatIds.has(c.SubLedgerID))
//         .map((c) => ({ ...c, isNew: true })); // ← new category
//       updated[existingIndex] = {
//         ...updated[existingIndex],
//         Categories: [...updated[existingIndex].Categories, ...newCategories],
//       };
//       return updated;
//     } else {
//       // New row — mark entire item as isNew: true
//       return [...prev, {
//         SLAccountID: selectedSLAccountId,
//         SLAccountCode: glAccount?.Code ?? '',
//         SLAccountName: glAccount?.Description ?? '',
//         SubLedgerTypeID: selectedTypeId,
//         isNew: true, // ← new record
//         Categories: selectedCategories.map((c) => ({
//           ...c,
//           isNew: true, // ← new category
//         })),
//       }];
//     }
//   });

//   setSelectedSLAccountId(0);
//   setSelectedTypeId(0);
//   setCategoryItems([]);
//   setSelectedCategoryIds(new Set());
// };
// const handleAddStaged = () => {
//   if (!selectedSLAccountId || selectedCategoryIds.size === 0) {
//     toast('Please select a GL Wise Sub Ledger and at least one Category item.', 'error');
//     return;
//   }

//   const glAccount = glAccounts.find((a) => a.AccountID === selectedSLAccountId);
//   const selectedCategories = categoryItems.filter((c) =>
//     selectedCategoryIds.has(c.SubLedgerID)
//   );

//   setStagedItems((prev) => {
//     // Check if this SLAccountID already exists in staged list
//     const existingIndex = prev.findIndex((s) => s.SLAccountID === selectedSLAccountId);

//     if (existingIndex !== -1) {
//       // ← Merge categories into existing row (avoid duplicates)
//       const updated = [...prev];
//       const existingCatIds = new Set(updated[existingIndex].Categories.map((c) => c.SubLedgerID));
//       const newCategories = selectedCategories.filter((c) => !existingCatIds.has(c.SubLedgerID));
//       updated[existingIndex] = {
//         ...updated[existingIndex],
//         Categories: [...updated[existingIndex].Categories, ...newCategories],
//       };
//       return updated;
//     } else {
//       // ← New row for this SLAccountID
//       return [...prev, {
//         SLAccountID: selectedSLAccountId,
//         SLAccountCode: glAccount?.Code ?? '',
//         SLAccountName: glAccount?.Description ?? '',
//         SubLedgerTypeID: selectedTypeId,
//         Categories: selectedCategories,
//       }];
//     }
//   });

//   // Reset for next selection
//   setSelectedSLAccountId(0);
//   setSelectedTypeId(0);
//   setCategoryItems([]);
//   setSelectedCategoryIds(new Set());
// };
//     const handleAddStaged = () => {
//   if (!selectedSLAccountId || selectedCategoryIds.size === 0) {
//     toast('Please select a GL Wise Sub Ledger and at least one Category item.', 'error');
//     return;
//   }

//   const glAccount = glAccounts.find((a) => a.AccountID === selectedSLAccountId);
//   const selectedCategories = categoryItems.filter((c) =>
//     selectedCategoryIds.has(c.SubLedgerID)
//   );

//   const newItem: StagedItem = {
//     SLAccountID: selectedSLAccountId,
//     SLAccountCode: glAccount?.Code ?? '',
//     SLAccountName: glAccount?.Description ?? '',
//     SubLedgerTypeID: selectedTypeId,
//     Categories: selectedCategories,
//   };

//   setStagedItems((prev) => [...prev, newItem]);

//   // Reset for next selection
//   setSelectedSLAccountId(0);
//   setSelectedTypeId(0);
//   setCategoryItems([]);
//   setSelectedCategoryIds(new Set());
// };

 const handleRemoveStaged = (index: number) => {
  const removedItem = stagedItems[index];

  // ← if edit mode and item is not new, mark as RecordState: 3
  if (templateId > 0 && !removedItem.isNew) {
    setDeletedItems((prev) => [...prev, removedItem]);
  }

  setStagedItems((prev) => prev.filter((_, i) => i !== index));
};

  if (loading) {
    return (
      <PageCard title="Account Template">
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </PageCard>
    );
  }

  const allGLChecked = glAccounts.length > 0 &&
    glAccounts.every((a) => selectedGLIds.has(a.AccountID));

  return (
    <PageCard title="Account Template">

      {/* Template Name */}
      <div className="mb-5">
        <label className="text-xs font-medium text-slate-600 mb-1 block">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="form-input max-w-sm"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g. Branch Template"
        />
      </div>

      {/* Step 1 — GL Accounts (top) */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          GL Accounts
          {selectedGLIds.size > 0 && (
            <span className="ml-2 badge badge-blue text-[10px]">{selectedGLIds.size} selected</span>
          )}
        </p>
        <div className="rounded-lg border border-slate-200 overflow-hidden max-h-52 overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    checked={allGLChecked}
                    onChange={(e) => toggleAllGL(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/3">
                  GL Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  GL Head
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {glAccounts.length === 0 ? (
  <tr>
    <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
      No GL accounts available
    </td>
  </tr>
) : (
  glAccounts.map((acc) => {
    const isAlreadyMapped = !templateId && mappedGLAccountIds.has(acc.AccountID);

    return (
      <tr
        key={acc.AccountID}
        onClick={() => !isAlreadyMapped && toggleGL(acc.AccountID)}
        className={cn(
          'border-b border-slate-100 last:border-0 transition-colors',
          isAlreadyMapped
            ? 'opacity-40 cursor-not-allowed bg-slate-50'
            : selectedGLIds.has(acc.AccountID)
              ? 'bg-blue-50/40 cursor-pointer'
              : 'hover:bg-slate-50 cursor-pointer',
        )}
      >
        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-blue-600"
            checked={selectedGLIds.has(acc.AccountID)}
            disabled={isAlreadyMapped}
            onChange={() => !isAlreadyMapped && toggleGL(acc.AccountID)}
          />
        </td>
        <td className="px-4 py-3">
          <span className="badge badge-slate text-[11px]">{acc.Code}</span>
        </td>
        <td className="px-4 py-3 text-sm text-slate-800 font-medium">
          {acc.Description}
          {isAlreadyMapped && (
            <span className="ml-2 badge badge-red text-[9px]">Already mapped</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-slate-400">{acc.AccountType}</td>
      </tr>
    );
  })
)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 2 + 3 — Bottom section */}
      {selectedGLIds.size > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

         
                  {/* Left — GL Wise Sub Ledger (radio) */}
<div>
  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
    GL Wise Sub Ledger
  </p>
  <div className="rounded-lg border border-slate-200 overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="px-4 py-3 w-12 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Select
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/3">
            GL Code
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
            GL Head
          </th>
        </tr>
      </thead>
      <tbody>
        {visibleGLSLAccounts.length === 0 ? (
          <tr>
            <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
              No GL SL accounts for selected GL accounts
            </td>
          </tr>
        ) : (
         visibleGLSLAccounts.map((acc) => {
  const isAlreadyMapped = !templateId && mappedSLAccountIds.has(acc.AccountID);
  
  // ← In edit mode, only disable if this account was in original staged list
  const isOriginallyStaged = templateId > 0 && 
    stagedItems.some((s) => s.SLAccountID === acc.AccountID && !s.isNew);
  
  const isDisabled = isAlreadyMapped || isOriginallyStaged;

  const handleSelect = () => {
    if (isDisabled) return;
    setSelectedSLAccountId(acc.AccountID);
    setSelectedTypeId(0);
    setCategoryItems([]);
    setSelectedCategoryIds(new Set());
    setCategoryLoading(true);
    getSubLedgerByAccountId(acc.AccountID)
      .then((r) => {
        const slAccount = r?.data?.SLAccount;
        setSelectedTypeId(slAccount?.SubLedgerTypeID ?? 0);
        setCategoryItems(slAccount?.SubLedger ?? []);
        setSelectedCategoryIds(new Set());
      })
      .catch(() => setCategoryItems([]))
      .finally(() => setCategoryLoading(false));
  };

  return (
    <tr
      key={acc.AccountID}
      onClick={handleSelect}
      className={cn(
        'border-b border-slate-100 last:border-0 transition-colors',
        isDisabled
          ? 'cursor-not-allowed bg-slate-50'
          : selectedSLAccountId === acc.AccountID
            ? 'bg-blue-50/40 cursor-pointer'
            : 'hover:bg-slate-50 cursor-pointer',
      )}
    >
      <td className="px-4 py-3 text-center">
        <input
          type="radio"
          name="glSlAccount"
          className="w-4 h-4 text-blue-600 border-slate-300"
          checked={selectedSLAccountId === acc.AccountID}
          disabled={isDisabled}
          onChange={() => {}}
        />
      </td>
      <td className="px-4 py-3">
        <span className="badge badge-slate text-[11px]">{acc.Code}</span>
      </td>
      <td className="px-4 py-3 text-sm font-medium">
        <span className={isOriginallyStaged ? 'text-slate-400' : 'text-slate-800'}>
          {acc.Description}
        </span>
        {isOriginallyStaged && (
          <span className="ml-2 badge badge-slate text-[9px]">Already mapped</span>
        )}
        {isAlreadyMapped && (
          <span className="ml-2 badge badge-red text-[9px]">Already mapped</span>
        )}
      </td>
    </tr>
  );
})
        )}
      </tbody>
    </table>
  </div>
</div>

          {/* Right — Category (sub ledger items) */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Category
              {selectedCategoryIds.size > 0 && (
                <span className="ml-2 badge badge-blue text-[10px]">{selectedCategoryIds.size} selected</span>
              )}
            </p>
            <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
              {categoryLoading ? (
                <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Loading…
                </div>
              ) : (
                <table className="w-full text-sm table-fixed">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 w-12 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/3">
                        SL Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        SL Head
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedTypeId ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                          Select a Sub Ledger Type
                        </td>
                      </tr>
                    ) : categoryItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                          No items available
                        </td>
                      </tr>
                    ) : (
                      categoryItems.map((item) => (
                        <tr
                          key={item.SubLedgerID}
                          onClick={() => {
                            setSelectedCategoryIds((prev) => {
                              const next = new Set(prev);
                              next.has(item.SubLedgerID)
                                ? next.delete(item.SubLedgerID)
                                : next.add(item.SubLedgerID);
                              return next;
                            });
                          }}
                          className={cn(
                            'border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                            selectedCategoryIds.has(item.SubLedgerID) ? 'bg-blue-50/40' : 'hover:bg-slate-50',
                          )}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-blue-600"
                              checked={selectedCategoryIds.has(item.SubLedgerID)}
                              onChange={() => {
                                setSelectedCategoryIds((prev) => {
                                  const next = new Set(prev);
                                  next.has(item.SubLedgerID)
                                    ? next.delete(item.SubLedgerID)
                                    : next.add(item.SubLedgerID);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-slate text-[11px]">{item.SubLedgerCode}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                            {item.SubLedgerDescription}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
          )}
          
          {/* Add button */}
{selectedSLAccountId !== 0 && selectedCategoryIds.size > 0 && (
  <div className="flex justify-end mb-4">
    <Button type="button" onClick={handleAddStaged}>
      <Plus size={13} /> Add
    </Button>
  </div>
)}

{/* Staged items list */}
{stagedItems.length > 0 && (
  <div className="mb-6">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
      Added ({stagedItems.length})
    </p>
    <div className="space-y-2">
      {stagedItems.map((item, idx) => (
  <div
    key={idx}
    onDoubleClick={() => {
      // ← populate bottom section with this staged item's data
      setSelectedSLAccountId(item.SLAccountID);
      setCategoryLoading(true);
      getSubLedgerByAccountId(item.SLAccountID)
        .then((r) => {
          const slAccount = r?.data?.SLAccount;
          setSelectedTypeId(slAccount?.SubLedgerTypeID ?? 0);
          setCategoryItems(slAccount?.SubLedger ?? []);
          // ← pre-check existing categories
          const existingCatIds = new Set<number>(
            item.Categories.map((c) => c.SubLedgerID)
          );
          setSelectedCategoryIds(existingCatIds);
        })
        .catch(() => setCategoryItems([]))
        .finally(() => setCategoryLoading(false));
    }}
    className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
  >
          <div className="flex items-start gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                <span className="badge badge-slate text-[11px] mr-2">{item.SLAccountCode}</span>
                {item.SLAccountName}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.Categories.map((cat) => (
                  <span key={cat.SubLedgerID} className="badge badge-blue text-[10px]">
                    {cat.SubLedgerDescription}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveStaged(idx)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
)}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-8 pt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={handleReset}>
          <X size={13} /> Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>

      {/* Template List */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Template List
        </p>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Template Name</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <Loader2 size={14} className="animate-spin" /> Loading…
                    </div>
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center text-slate-400 text-sm">
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((t, idx) => (
                  <tr
                    key={t.TemplateID}
                    onDoubleClick={() => handleEdit(t)}
                    className="cursor-pointer"
                  >
                    <td className="text-slate-400">{idx + 1}</td>
                    <td className="font-medium text-slate-800">{t.TemplateName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </PageCard>
  );
}