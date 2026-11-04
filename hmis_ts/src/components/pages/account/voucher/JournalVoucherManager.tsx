import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Check, Search, Lock, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import {
  getCashBankLedgerAccountsForVoucher,
  createJournalVoucher,
  getCostCentres,
  getLocations,
  getVouchers,
} from '@/apis/finance/financeApi';
import PageCard from '@/components/shared/PageCard';
import FormField from '@/components/shared/FormField';
import DynamicFooter from '@/components/shared/DynamicFooter';
import Modal from '@/components/panels/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { VOUCHER_WORKFLOW } from '@/utils/Voucherworkflow';

// ── Types ────────────────────────────────────────────────────────────────────

interface SubLedger { SubLedgerID: number; AccountCode: string; AccountDescription: string; }
interface LedgerAccount {
  AccountID: number;
  Code: string;
  Description: string;
  GLSLFlag: string;
  SubLedger: SubLedger[];
}
interface Option { id: number; label: string; }

interface RawCostCentre { CostCentreID: number; Description: string; ShortName: string; }
interface RawLocation { LocationID: number; Description: string; ShortName: string; }

interface VoucherPosting {
  LineNo: number;
  GLAccountID: number;
  SLAccountID: number | null;
  CostCenterID: number | null;
  LocationID: number | null;
  Amount: number;
  AmountSign: 'D' | 'C';
  LineNarration: string | null;
  CostCenter?: string;
  Location?: string;
}

interface VoucherRecord {
  DocumentHeaderID: number;
  VoucherSeries: string;
  VoucherNo: string;
  DocumentTypeID: number;
  DocumentDate: string;
  DocumentAmount: number;
  Narration: string | null;
  DocumentID?: number;     // workflow stage of this record (menu ID)
  PrevVoucherID?: number;
  NextVoucherID?: number;  // > 0 → this prepared voucher has been passed
  Posting: VoucherPosting[];
}

// A saved voucher loaded into the form (double-click in the list)
interface OpenedVoucher {
  documentHeaderId: number;
  voucherNo: string;
  locked: boolean; // passed → read-only
}

type VoucherSearchKey = 'DocumentHeaderID' | 'VoucherNo' | 'VoucherSeries' | 'DocumentDate' | 'EntryDate';

const SEARCH_KEYS: { value: VoucherSearchKey; label: string; kind: 'text' | 'number' | 'date'; placeholder?: string }[] = [
  { value: 'VoucherNo', label: 'Voucher No', kind: 'text', placeholder: 'e.g. 000007' },
  { value: 'VoucherSeries', label: 'Voucher Series', kind: 'text', placeholder: 'e.g. JRN/20261101' },
  { value: 'DocumentDate', label: 'Voucher Date', kind: 'date' },
  { value: 'EntryDate', label: 'Entry Date', kind: 'date' },
  { value: 'DocumentHeaderID', label: 'Document ID', kind: 'number', placeholder: 'e.g. 14' },
];

interface VoucherSearch { keyName: VoucherSearchKey | ''; keyValue: string; }
const EMPTY_SEARCH: VoucherSearch = { keyName: '', keyValue: '' };

const PAGE_SIZE = 10;
// The list SP returns every workflow stage mixed together, so fetch a batch,
// keep only preparation-stage records, and page on the client.
const FETCH_SIZE = 500;

// doc_type_dDocTypId from the Data sheet: Journal = 3
const JOURNAL_DOC_TYPE_ID = 3;
const WORKFLOW = VOUCHER_WORKFLOW.JOURNAL;

interface VoucherLine {
  AccountID: number;
  AccountLabel: string;
  SubLedgerID: number;
  SubLedgerLabel: string;
  CostCentreID: number;
  CostCentreLabel: string;
  LocationID: number;
  LocationLabel: string;
  DrAmount: number;
  CrAmount: number;
  Remarks: string;
}

interface EntryState {
  AccountID: number;
  SubLedgerID: number;
  CostCentreID: number;
  LocationID: number;
  Dr: string;
  Cr: string;
  Remarks: string;
}

const EMPTY_ENTRY: EntryState = {
  AccountID: 0,
  SubLedgerID: 0,
  CostCentreID: 0,
  LocationID: 0,
  Dr: '',
  Cr: '',
  Remarks: '',
};

// Header + lines fingerprint, used to detect unsaved changes
interface FormSnapshot { voucherDate: string; narration: string; lines: VoucherLine[]; }
const makeSnapshot = (f: FormSnapshot) => JSON.stringify(f);

// ── Helpers ──────────────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (x: unknown) => Number(x ?? 0) || 0;

// Local date → yyyy-mm-dd (toISOString would shift to UTC and can give yesterday's date in IST)
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Derives the Apr–Mar range from YearShortName ("2026-27", "2026-2027", "26-27").
function getFYRange(yearShortName?: string): { start: string; end: string } | null {
  if (!yearShortName) return null;
  let startYear: number | null = null;
  const four = yearShortName.match(/(\d{4})/);
  if (four) {
    startYear = Number(four[1]);
  } else {
    const two = yearShortName.match(/(\d{2})\s*[-/]\s*(\d{2})/);
    if (two) startYear = 2000 + Number(two[1]);
  }
  if (!startYear) return null;
  return { start: `${startYear}-04-01`, end: `${startYear + 1}-03-31` };
}

function clampDate(iso: string, range: { start: string; end: string } | null): string {
  if (!range) return iso;
  if (iso < range.start) return range.start;
  if (iso > range.end) return range.end;
  return iso;
}

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

// "06/10/2026" or "2026-10-06T00:00:00" → "2026-10-06"
function apiDateToISO(v?: string | null): string {
  if (!v) return '';
  const dmy = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : '';
}

function formatDisplayDate(v?: string | null): string {
  const iso = apiDateToISO(v);
  if (!iso) return v ?? '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

const toSpDate = (iso: string) => iso.replace(/-/g, '/'); // yyyy-mm-dd → yyyy/mm/dd
const voucherNoOf = (v: VoucherRecord) => [v.VoucherSeries, v.VoucherNo].filter(Boolean).join('/');
const isPassed = (v: VoucherRecord) => num(v.NextVoucherID) > 0;

function parseAmount(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? round2(n) : NaN;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function JournalVoucherManager() {
  const { toast } = useToast();
  const { showModal, modalState, handleClose } = useModal();

  const user = useAppSelector((s) => s.auth.user);
  const dept = (user as any)?.UserDepartment?.[0];
  const companyId: number = dept?.CompanyID ?? 0;
  const companyGroupId: number = dept?.CompanyGroupID ?? 0;
  const financialYearId: number = dept?.FinancialYearID ?? 0;
  const yearShortName: string | undefined = dept?.YearShortName;

  const title = 'Journal Voucher';
  const fyRange = useMemo(() => getFYRange(yearShortName), [yearShortName]);
  const today = toISODate(new Date());
  const defaultVoucherDate = clampDate(today, fyRange);

  // Masters
  const [ledgers, setLedgers] = useState<LedgerAccount[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [costCentresByGL, setCostCentresByGL] = useState<Record<number, Option[]>>({});
  const [loadingCostCentres, setLoadingCostCentres] = useState(false);
  const [loading, setLoading] = useState(true);

  // Saved voucher list + the voucher currently loaded into the form
  const [opened, setOpened] = useState<OpenedVoucher | null>(null);
  const [allVouchers, setAllVouchers] = useState<VoucherRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState<VoucherSearch>(EMPTY_SEARCH);
  const [appliedSearch, setAppliedSearch] = useState<VoucherSearch | null>(null); // null = not searched yet
  const [pageNo, setPageNo] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Header
  const [voucherDate, setVoucherDate] = useState(defaultVoucherDate);
  const [narration, setNarration] = useState('');

  // Lines
  const [lines, setLines] = useState<VoucherLine[]>([]);
  const [entry, setEntry] = useState<EntryState>(EMPTY_ENTRY);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const emptySnapshot = makeSnapshot({ voucherDate: defaultVoucherDate, narration: '', lines: [] });
  const snapshotRef = useRef(emptySnapshot);

  // ── Load masters ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getCashBankLedgerAccountsForVoucher(companyId, companyGroupId, financialYearId).then((r) =>
        setLedgers(r?.data?.Accounts ?? []),
      ),
      getLocations(companyId, companyGroupId).then((r) => {
        const rows: RawLocation[] = Array.isArray(r?.data) ? r.data : [];
        setLocations(rows.map((l) => ({ id: l.LocationID, label: l.Description })));
      }),
    ])
      .catch((err) => toast(getErrorMessage(err, 'Failed to load accounts.'), 'error'))
      .finally(() => setLoading(false));
  }, [companyId, companyGroupId, financialYearId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedLedger = ledgers.find((l) => l.AccountID === entry.AccountID);
  const subLedgers = selectedLedger?.SubLedger ?? [];
  const slRequired = subLedgers.length > 0; // required only when the ledger has sub ledgers
  const selectedSL = subLedgers.find((s) => s.SubLedgerID === entry.SubLedgerID);
  const costCentres = costCentresByGL[entry.AccountID] ?? [];

  const readOnly = !!opened?.locked;

  // A journal must balance: total Dr = total Cr
  const totals = useMemo(() => {
    const dr = round2(lines.reduce((s, l) => s + l.DrAmount, 0));
    const cr = round2(lines.reduce((s, l) => s + l.CrAmount, 0));
    return { dr, cr, diff: round2(dr - cr) };
  }, [lines]);
  const balanced = totals.dr > 0 && totals.diff === 0;

  const paging = {
    totalRecords: allVouchers.length,
    pageCount: Math.ceil(allVouchers.length / PAGE_SIZE),
  };
  const vouchers = allVouchers.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE);

  // ── Entry handlers ─────────────────────────────────────────────────────────
  const patchEntry = (patch: Partial<EntryState>) => setEntry((p) => ({ ...p, ...patch }));

  // Cost centres are mapped per GL — fetched on first use, then cached
  const ensureCostCentres = async (glAccountId: number): Promise<Option[]> => {
    if (!glAccountId) return [];
    const cached = costCentresByGL[glAccountId];
    if (cached) return cached;
    setLoadingCostCentres(true);
    try {
      const r = await getCostCentres(companyId, companyGroupId, glAccountId);
      const rows: RawCostCentre[] = r?.data?.CostCentres ?? [];
      const list = rows.map((c) => ({ id: c.CostCentreID, label: c.Description }));
      setCostCentresByGL((p) => ({ ...p, [glAccountId]: list }));
      return list;
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to load cost centres.'), 'error');
      return [];
    } finally {
      setLoadingCostCentres(false);
    }
  };

  const handleLedgerChange = (accountId: number) => {
    patchEntry({ AccountID: accountId, SubLedgerID: 0, CostCentreID: 0 });
    void ensureCostCentres(accountId);
  };

  // Dr and Cr are mutually exclusive on a line
  const handleAmountChange = (side: 'Dr' | 'Cr', value: string) =>
    setEntry((p) =>
      side === 'Dr'
        ? { ...p, Dr: value, Cr: value ? '' : p.Cr }
        : { ...p, Cr: value, Dr: value ? '' : p.Dr },
    );

  const validateEntry = (): string | null => {
    if (!selectedLedger) return 'Please select a ledger.';
    if (slRequired && !entry.SubLedgerID) return 'Please select a sub ledger.';
    const dr = entry.Dr ? parseAmount(entry.Dr) : 0;
    const cr = entry.Cr ? parseAmount(entry.Cr) : 0;
    if (Number.isNaN(dr) || Number.isNaN(cr)) return 'Enter a valid amount.';
    if (dr < 0 || cr < 0) return 'Amounts cannot be negative.';
    if (dr === 0 && cr === 0) return 'Enter either a Dr or a Cr amount.';
    if (dr > 0 && cr > 0) return 'A line can have either Dr or Cr, not both.';
    return null;
  };

  const handleAddOrUpdateLine = () => {
    const err = validateEntry();
    if (err) {
      toast(err, 'error');
      return;
    }
    const costCentre = costCentres.find((c) => c.id === entry.CostCentreID);
    const location = locations.find((l) => l.id === entry.LocationID);

    const line: VoucherLine = {
      AccountID: selectedLedger!.AccountID,
      AccountLabel: `${selectedLedger!.Code} — ${selectedLedger!.Description}`,
      SubLedgerID: entry.SubLedgerID,
      SubLedgerLabel: selectedSL?.AccountDescription ?? '',
      CostCentreID: entry.CostCentreID,
      CostCentreLabel: costCentre?.label ?? '',
      LocationID: entry.LocationID,
      LocationLabel: location?.label ?? '',
      DrAmount: entry.Dr ? parseAmount(entry.Dr) : 0,
      CrAmount: entry.Cr ? parseAmount(entry.Cr) : 0,
      Remarks: entry.Remarks.trim(),
    };

    setLines((prev) =>
      editingIndex === null ? [...prev, line] : prev.map((l, i) => (i === editingIndex ? line : l)),
    );
    setEntry(EMPTY_ENTRY);
    setEditingIndex(null);
  };

  const handleEditLine = (index: number) => {
    const l = lines[index];
    setEntry({
      AccountID: l.AccountID,
      SubLedgerID: l.SubLedgerID,
      CostCentreID: l.CostCentreID,
      LocationID: l.LocationID,
      Dr: l.DrAmount ? String(l.DrAmount) : '',
      Cr: l.CrAmount ? String(l.CrAmount) : '',
      Remarks: l.Remarks,
    });
    setEditingIndex(index);
    void ensureCostCentres(l.AccountID);
  };

  const handleCancelEdit = () => {
    setEntry(EMPTY_ENTRY);
    setEditingIndex(null);
  };

  const handleDeleteLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) handleCancelEdit();
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  // ── Voucher handlers ───────────────────────────────────────────────────────
  const entryIsDirty =
    entry.AccountID !== 0 || entry.Dr !== '' || entry.Cr !== '' || entry.Remarks.trim() !== '';

  const isDirty = entryIsDirty || makeSnapshot({ voucherDate, narration, lines }) !== snapshotRef.current;

  const validateVoucher = (): string | null => {
    if (readOnly) return 'This voucher has been passed and cannot be edited.';
    if (!voucherDate) return 'Please enter the voucher date.';
    if (fyRange && (voucherDate < fyRange.start || voucherDate > fyRange.end)) {
      return `Voucher date must be within the financial year (${fyRange.start} to ${fyRange.end}).`;
    }
    if (editingIndex !== null) return 'Finish or cancel the line you are editing first.';
    if (entryIsDirty) return 'The entry row has a line that has not been added yet.';
    if (lines.length < 2) return 'A journal needs at least two lines (one Dr and one Cr).';
    if (totals.dr === 0 || totals.cr === 0) return 'A journal needs at least one Dr line and one Cr line.';
    if (totals.diff !== 0) {
      return `Dr and Cr totals must be equal. Dr ${fmt(totals.dr)}, Cr ${fmt(totals.cr)} — difference ${fmt(Math.abs(totals.diff))}.`;
    }
    return null;
  };

  // Matches the journal-voucher @jsonTemplate. Optional IDs are sent as 0.
  const buildPayload = () => ({
    RecordState: opened ? 2 : 1, // 1 = create, 2 = edit
    WorkflowDocumentID: WORKFLOW.preparation,
    DocumentHeaderID: opened?.documentHeaderId ?? 0,
    DocumentType: 'JOURNAL',
    BranchCompanyID: companyId,
    GroupCompanyID: companyGroupId,
    FinancialYearID: financialYearId,
    DRCRFlag: 'D',
    DocumentAmount: totals.dr, // = total Cr (balanced)
    DocumentDate: toSpDate(voucherDate),
    DocumentPreparationDate: toSpDate(today),
    Narration: narration.trim(),
    Posting: lines.map((l, i) => ({
      LineNo: i + 1,
      GLAccountID: l.AccountID,
      SLAccountID: l.SubLedgerID || 0,
      CostCenterID: l.CostCentreID || 0,
      LocationID: l.LocationID || 0,
      Amount: l.DrAmount || l.CrAmount,
      AmountSign: l.DrAmount ? 'D' : 'C',
      LineNarration: l.Remarks,
    })),
  });

  const resetForm = () => {
    setVoucherDate(defaultVoucherDate);
    setNarration('');
    setLines([]);
    setEntry(EMPTY_ENTRY);
    setEditingIndex(null);
    setOpened(null);
    snapshotRef.current = emptySnapshot;
  };

  const handleSubmit = async () => {
    const err = validateVoucher();
    if (err) {
      toast(err, 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await createJournalVoucher(buildPayload());
      if (res?.success === false || res?.data?.IsSuccess === false) {
        throw new Error(res?.data?.ErrorDescription || res?.message || 'Failed to save voucher.');
      }
      const savedNo =
        [res?.data?.VoucherSeries, res?.data?.VoucherNo].filter(Boolean).join('/') || opened?.voucherNo || '';
      const verb = opened ? 'updated' : 'saved';
      toast(savedNo ? `Voucher ${savedNo} ${verb} successfully!` : `Voucher ${verb} successfully!`, 'success');
      resetForm();
      if (appliedSearch) void loadVouchers(appliedSearch, pageNo);
    } catch (e: unknown) {
      toast(getErrorMessage(e, 'Failed to save voucher.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDiscard = (dlgTitle: string, message: string) =>
    showModal({ title: dlgTitle, message, variant: 'warning', confirmText: 'Yes, Discard', cancelText: 'Cancel' });

  const handleClear = async () => {
    if (isDirty) {
      const ok = await confirmDiscard('Clear Voucher', 'This will discard your unsaved changes. Continue?');
      if (!ok) return;
    }
    resetForm();
  };

  // ── Saved voucher list ─────────────────────────────────────────────────────
  async function loadVouchers(search: VoucherSearch, page: number) {
    setListLoading(true);
    try {
      const r = await getVouchers({
        DocumentTypeID: JOURNAL_DOC_TYPE_ID,
        BranchCompanyID: companyId,
        GroupCompanyID: companyGroupId,
        FinancialYearID: financialYearId,
        WorkflowDocumentID: WORKFLOW.preparation,
        KeyName: search.keyName,
        KeyValue: search.keyValue.trim(),
        PageNo: 1,
        PageSize: FETCH_SIZE,
      });
      const d = r?.data;
      if (d?.IsSuccess === false) throw new Error(d?.ErrorDescription || 'Failed to load vouchers.');
      const all: VoucherRecord[] = d?.Vouchers ?? [];
      // Only preparation-stage records — pass records are separate rows and must not be edited here
      const rows = all.filter((v) => [WORKFLOW.preparation, 0].includes(num(v.DocumentID)));
      setAllVouchers(rows);
      setPageNo(Math.min(Math.max(page, 1), Math.max(1, Math.ceil(rows.length / PAGE_SIZE))));
    } catch (err) {
      setAllVouchers([]);
      setPageNo(1);
      toast(getErrorMessage(err, 'Failed to load vouchers.'), 'error');
    } finally {
      setListLoading(false);
    }
  }

  const selectedKey = SEARCH_KEYS.find((k) => k.value === searchDraft.keyName);

  // No field selected → list all vouchers. Field selected → its value is required.
  const handleRunSearch = () => {
    if (searchDraft.keyName && !searchDraft.keyValue.trim()) {
      toast(`Please enter the ${selectedKey?.label ?? 'search value'}.`, 'error');
      return;
    }
    const search = { ...searchDraft, keyValue: searchDraft.keyValue.trim() };
    setAppliedSearch(search);
    void loadVouchers(search, 1);
  };

  const handleResetSearch = () => {
    setSearchDraft(EMPTY_SEARCH);
    setAppliedSearch(null);
    setAllVouchers([]);
    setPageNo(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > paging.pageCount) return;
    setPageNo(page);
  };

  // Footer "Search" → toggles the search section
  const handleSearch = () => {
    setSearchOpen((open) => {
      if (!open) setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return !open;
    });
  };

  const handleOpenVoucher = async (v: VoucherRecord) => {
    if (opened?.documentHeaderId === v.DocumentHeaderID) return;
    if (isDirty) {
      const ok = await confirmDiscard('Open Voucher', `You have unsaved changes. Discard them and open ${voucherNoOf(v)}?`);
      if (!ok) return;
    }

    const postings = [...(v.Posting ?? [])].sort((a, b) => a.LineNo - b.LineNo);

    // Resolve cost-centre names for every GL used on the voucher
    const glIds = [...new Set(postings.filter((p) => p.CostCenterID).map((p) => p.GLAccountID))];
    const ccLists = await Promise.all(glIds.map((id) => ensureCostCentres(id)));
    const ccLabel = new Map<string, string>();
    glIds.forEach((id, i) => ccLists[i].forEach((c) => ccLabel.set(`${id}:${c.id}`, c.label)));

    const loaded: VoucherLine[] = postings.map((p) => {
      const gl = ledgers.find((l) => l.AccountID === p.GLAccountID);
      const sl = gl?.SubLedger.find((s) => s.SubLedgerID === p.SLAccountID);
      return {
        AccountID: p.GLAccountID,
        AccountLabel: gl ? `${gl.Code} — ${gl.Description}` : `GL #${p.GLAccountID}`,
        SubLedgerID: p.SLAccountID ?? 0,
        SubLedgerLabel: sl?.AccountDescription ?? (p.SLAccountID ? `SL #${p.SLAccountID}` : ''),
        CostCentreID: p.CostCenterID ?? 0,
        CostCentreLabel: p.CostCenterID
          ? p.CostCenter || ccLabel.get(`${p.GLAccountID}:${p.CostCenterID}`) || `#${p.CostCenterID}`
          : '',
        LocationID: p.LocationID ?? 0,
        LocationLabel: p.LocationID
          ? p.Location || locations.find((l) => l.id === p.LocationID)?.label || `#${p.LocationID}`
          : '',
        DrAmount: p.AmountSign === 'D' ? p.Amount : 0,
        CrAmount: p.AmountSign === 'C' ? p.Amount : 0,
        Remarks: p.LineNarration ?? '',
      };
    });

    const header = { voucherDate: apiDateToISO(v.DocumentDate), narration: v.Narration ?? '' };

    setLines(loaded);
    setEntry(EMPTY_ENTRY);
    setEditingIndex(null);
    setVoucherDate(header.voucherDate);
    setNarration(header.narration);
    setOpened({ documentHeaderId: v.DocumentHeaderID, voucherNo: voucherNoOf(v), locked: isPassed(v) });
    snapshotRef.current = makeSnapshot({ ...header, lines: loaded });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageCard title={title}>
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </PageCard>
    );
  }

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />

      <PageCard title={title}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <FormField label="Voucher No">
            <input className="form-input readonly" readOnly value={opened?.voucherNo ?? ''} placeholder="Auto-generated" />
          </FormField>

          <FormField label="Date" required hint={yearShortName ? `FY ${yearShortName}` : undefined}>
            <input
              type="date"
              className="form-input"
              value={voucherDate}
              disabled={readOnly}
              min={fyRange?.start}
              max={fyRange?.end}
              onChange={(e) => setVoucherDate(e.target.value)}
            />
          </FormField>

          <FormField label="Voucher Amount" className="md:col-start-4 md:items-end">
            <div className="h-8 flex items-center gap-2">
              <span className="text-base font-semibold text-slate-800 tabular-nums">{fmt(totals.dr)}</span>
              {lines.length > 0 &&
                (balanced ? (
                  <span className="badge badge-green text-[11px]">Balanced</span>
                ) : (
                  <span className="badge badge-red text-[11px]">Diff {fmt(Math.abs(totals.diff))}</span>
                ))}
            </div>
          </FormField>
        </div>

        {opened && (
          <div
            className={cn(
              'rounded-lg border px-4 py-2.5 mb-4 flex items-center gap-2 text-sm',
              opened.locked ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-amber-200 bg-amber-50 text-amber-800',
            )}
          >
            {opened.locked ? <Lock size={14} /> : <Pencil size={14} />}
            {opened.locked ? 'Viewing passed voucher' : 'Editing voucher'}{' '}
            <span className="font-semibold">{opened.voucherNo}</span>
            {opened.locked ? ' — read-only.' : '.'} Click Close to start a new voucher.
          </div>
        )}

        {/* ── Line entry ─────────────────────────────────────────── */}
        {!readOnly && (
          <div
            className={cn(
              'rounded-xl border p-4 mb-4',
              editingIndex !== null ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/50',
            )}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {editingIndex !== null ? `Editing line ${editingIndex + 1}` : 'Add Line'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField label="Ledger" required className="md:col-span-2">
                <select
                  className="form-select"
                  value={entry.AccountID}
                  onChange={(e) => handleLedgerChange(Number(e.target.value))}
                >
                  <option value={0}>-- Select Ledger --</option>
                  {ledgers.map((l) => (
                    <option key={l.AccountID} value={l.AccountID}>
                      {l.Code} — {l.Description}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Sub Ledger" required={slRequired} className="md:col-span-2">
                <select
                  className="form-select"
                  value={entry.SubLedgerID}
                  disabled={!slRequired}
                  onChange={(e) => patchEntry({ SubLedgerID: Number(e.target.value) })}
                >
                  <option value={0}>
                    {!selectedLedger ? '-- Select Ledger first --' : !slRequired ? 'Not applicable' : '-- Select --'}
                  </option>
                  {subLedgers.map((s) => (
                    <option key={s.SubLedgerID} value={s.SubLedgerID}>
                      {s.AccountCode} — {s.AccountDescription}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Cost Centre">
                <select
                  className="form-select"
                  value={entry.CostCentreID}
                  disabled={loadingCostCentres || costCentres.length === 0}
                  onChange={(e) => patchEntry({ CostCentreID: Number(e.target.value) })}
                >
                  <option value={0}>
                    {!selectedLedger
                      ? '-- Select Ledger first --'
                      : loadingCostCentres
                        ? 'Loading…'
                        : costCentres.length === 0
                          ? 'None for this ledger'
                          : '-- Select --'}
                  </option>
                  {costCentres.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Location">
                <select
                  className="form-select"
                  value={entry.LocationID}
                  disabled={locations.length === 0}
                  onChange={(e) => patchEntry({ LocationID: Number(e.target.value) })}
                >
                  <option value={0}>{locations.length === 0 ? 'No options' : '-- Select --'}</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Dr. Amount">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={cn('form-input text-right', entry.Dr && 'border-blue-300 bg-blue-50/30')}
                  value={entry.Dr}
                  placeholder="0.00"
                  onChange={(e) => handleAmountChange('Dr', e.target.value)}
                />
              </FormField>

              <FormField label="Cr. Amount">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={cn('form-input text-right', entry.Cr && 'border-emerald-300 bg-emerald-50/30')}
                  value={entry.Cr}
                  placeholder="0.00"
                  onChange={(e) => handleAmountChange('Cr', e.target.value)}
                />
              </FormField>

              <FormField label="Remarks" className="md:col-span-3">
                <input
                  type="text"
                  className="form-input"
                  value={entry.Remarks}
                  maxLength={250}
                  onChange={(e) => patchEntry({ Remarks: e.target.value })}
                  placeholder="Line remarks"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdateLine()}
                />
              </FormField>

              <div className="flex items-end gap-2">
                <Button type="button" onClick={handleAddOrUpdateLine} className="flex-1">
                  {editingIndex !== null ? <><Check size={13} /> Update</> : <><Plus size={13} /> Add</>}
                </Button>
                {editingIndex !== null && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    <X size={13} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Lines grid ─────────────────────────────────────────── */}
        <div className="rounded-lg border border-slate-200 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Ledger</th>
                  <th>Sub Ledger</th>
                  <th>Cost Centre</th>
                  <th className="text-right">Dr.</th>
                  <th className="text-right">Cr.</th>
                  <th>Remarks</th>
                  <th>Location</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 text-sm">
                      No lines added yet
                    </td>
                  </tr>
                ) : (
                  lines.map((l, idx) => (
                    <tr key={idx} className={cn(editingIndex === idx && 'bg-amber-50')}>
                      <td className="text-slate-400">{idx + 1}</td>
                      <td className="font-medium text-slate-800">{l.AccountLabel}</td>
                      <td>{l.SubLedgerLabel || <span className="text-slate-300">—</span>}</td>
                      <td>{l.CostCentreLabel || <span className="text-slate-300">—</span>}</td>
                      <td className="text-right text-blue-700">{l.DrAmount ? fmt(l.DrAmount) : ''}</td>
                      <td className="text-right text-emerald-700">{l.CrAmount ? fmt(l.CrAmount) : ''}</td>
                      <td className="text-xs text-slate-500">{l.Remarks}</td>
                      <td>{l.LocationLabel || <span className="text-slate-300">—</span>}</td>
                      <td>
                        {!readOnly && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => handleEditLine(idx)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              title="Edit line"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLine(idx)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Remove line"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {lines.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-sm">
                    <td colSpan={4} className="px-4 py-2 text-right text-slate-500">Total</td>
                    <td className="px-4 py-2 text-right text-blue-700">{fmt(totals.dr)}</td>
                    <td className="px-4 py-2 text-right text-emerald-700">{fmt(totals.cr)}</td>
                    <td colSpan={3} className={cn('px-4 py-2 text-xs', balanced ? 'text-emerald-600' : 'text-red-500')}>
                      {balanced ? 'Balanced ✓' : `Difference ${fmt(Math.abs(totals.diff))} — Dr and Cr must be equal`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Narration ──────────────────────────────────────────── */}
        <FormField label="Narration">
          <textarea
            rows={2}
            className="form-textarea"
            value={narration}
            readOnly={readOnly}
            maxLength={500}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Enter narration"
          />
        </FormField>

        <DynamicFooter
          saving={saving}
          onClose={handleClear}
          onSubmit={handleSubmit}
          onSearch={handleSearch}
          hideSubmit={readOnly}
          className="mt-4"
        />
      </PageCard>

      {/* ── Voucher search (opened from footer Search) ─────────── */}
      {searchOpen && (
        <div ref={listRef} className="scroll-mt-4">
          <PageCard title={`Search ${title}`} className="mt-4" showBackButton={false}>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <FormField label="Search By" className="w-full sm:w-52">
                <select
                  className="form-select"
                  value={searchDraft.keyName}
                  onChange={(e) => setSearchDraft({ keyName: e.target.value as VoucherSearchKey | '', keyValue: '' })}
                >
                  <option value="">All Vouchers</option>
                  {SEARCH_KEYS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={selectedKey?.label ?? 'Value'} required={!!selectedKey} className="w-full sm:w-60">
                <input
                  type={selectedKey?.kind === 'date' ? 'date' : selectedKey?.kind === 'number' ? 'number' : 'text'}
                  min={selectedKey?.kind === 'number' ? 1 : undefined}
                  className="form-input"
                  value={searchDraft.keyValue}
                  disabled={!selectedKey}
                  placeholder={selectedKey ? selectedKey.placeholder : 'Not needed for All Vouchers'}
                  onChange={(e) => setSearchDraft((f) => ({ ...f, keyValue: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSearch()}
                />
              </FormField>

              <div className="flex gap-2">
                <Button type="button" onClick={handleRunSearch} disabled={listLoading}>
                  <Search size={13} /> Search
                </Button>
                <Button type="button" variant="outline" onClick={handleResetSearch}>
                  <RotateCcw size={13} /> Reset
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="ml-auto self-start p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close search"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>

            {appliedSearch && (
              <>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="w-10">#</th>
                          <th>Voucher No</th>
                          <th>Date</th>
                          <th className="text-right">Amount</th>
                          <th>Narration</th>
                          <th className="text-center">Lines</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listLoading ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                              <Loader2 size={14} className="animate-spin inline mr-2" />
                              Loading vouchers…
                            </td>
                          </tr>
                        ) : vouchers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                              No vouchers found
                            </td>
                          </tr>
                        ) : (
                          vouchers.map((v, idx) => (
                            <tr
                              key={v.DocumentHeaderID}
                              onDoubleClick={() => handleOpenVoucher(v)}
                              className={cn(
                                'cursor-pointer select-none hover:bg-blue-50',
                                opened?.documentHeaderId === v.DocumentHeaderID && 'bg-amber-50',
                              )}
                              title="Double-click to open"
                            >
                              <td className="text-slate-400">{(pageNo - 1) * PAGE_SIZE + idx + 1}</td>
                              <td className="font-medium text-slate-800">{voucherNoOf(v)}</td>
                              <td>{formatDisplayDate(v.DocumentDate)}</td>
                              <td className="text-right tabular-nums">{fmt(v.DocumentAmount)}</td>
                              <td className="text-xs text-slate-500">{v.Narration}</td>
                              <td className="text-center">{v.Posting?.length ?? 0}</td>
                              <td className="text-center">
                                {isPassed(v) ? (
                                  <span className="badge badge-green text-[11px]">Passed</span>
                                ) : (
                                  <span className="badge badge-blue text-[11px]">Prepared</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>
                    {paging.totalRecords} voucher{paging.totalRecords === 1 ? '' : 's'} found · double-click to open
                  </span>
                  {paging.pageCount > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pageNo <= 1 || listLoading}
                        onClick={() => handlePageChange(pageNo - 1)}
                      >
                        <ChevronLeft size={13} />
                      </Button>
                      <span>Page {pageNo} of {paging.pageCount}</span>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pageNo >= paging.pageCount || listLoading}
                        onClick={() => handlePageChange(pageNo + 1)}
                      >
                        <ChevronRight size={13} />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </PageCard>
        </div>
      )}
    </>
  );
}