import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Check, Search, Lock, RotateCcw } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import {
  getCashBankAccountsForVoucher,
  getCashBankLedgerAccountsForVoucher,
  createCashBankVoucher,
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
// ── Types ────────────────────────────────────────────────────────────────────

export type VoucherType = 'CASH' | 'BANK';

interface CashBankAccount { AccountID: number; Code: string; Description: string; }
interface SubLedgerBank { SubLedgerBankID: number; BankAccountNo: string; BankAccountName: string; }
interface SubLedger {
  SubLedgerID: number;
  AccountCode: string;
  AccountDescription: string;
  SubLedgerBank: SubLedgerBank[];
}
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
  PayToID?: number | null;
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
  ChequeNo?: string | null;
  ChequeDate?: string | null;
  IsPassed?: boolean; // not returned yet — passed vouchers become read-only once it is
  Posting: VoucherPosting[];
}

// A saved voucher loaded into the form (double-click in the list)
interface OpenedVoucher {
  documentHeaderId: number;
  voucherNo: string;
  amount: number;
  sign: 'DR' | 'CR' | '';
  locked: boolean; // passed → read-only
}

type VoucherSearchKey =
  | 'DocumentHeaderID'
  | 'VoucherNo'
  | 'VoucherSeries'
  | 'DocumentDate'
  | 'ChequeNo'
  | 'EntryDate';

const SEARCH_KEYS: { value: VoucherSearchKey; label: string; kind: 'text' | 'number' | 'date'; placeholder?: string }[] = [
  { value: 'VoucherNo', label: 'Voucher No', kind: 'text', placeholder: 'e.g. 000007' },
  { value: 'VoucherSeries', label: 'Voucher Series', kind: 'text', placeholder: 'e.g. CSH/20261006' },
  { value: 'DocumentDate', label: 'Voucher Date', kind: 'date' },
  { value: 'EntryDate', label: 'Entry Date', kind: 'date' },
  { value: 'ChequeNo', label: 'Cheque No', kind: 'text', placeholder: 'Enter cheque no' },
  { value: 'DocumentHeaderID', label: 'Document ID', kind: 'number', placeholder: 'e.g. 14' },
];

interface VoucherSearch {
  keyName: VoucherSearchKey | '';
  keyValue: string;
}

const EMPTY_SEARCH: VoucherSearch = { keyName: '', keyValue: '' };
const PAGE_SIZE = 10;

// Header + lines fingerprint, used to detect unsaved changes
interface FormSnapshot {
  voucherDate: string;
  cashBankAccountId: number;
  chequeNo: string;
  chequeDate: string;
  narration: string;
  lines: VoucherLine[];
}
const makeSnapshot = (f: FormSnapshot) => JSON.stringify(f);

interface VoucherLine {
  AccountID: number;
  AccountLabel: string;
  SubLedgerID: number;
  SubLedgerLabel: string;
  SubLedgerBankID: number;
  PayToLabel: string;
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
  SubLedgerBankID: number;
  CostCentreID: number;
  LocationID: number;
  Dr: string;
  Cr: string;
  Remarks: string;
}

// doc_type_dDocTypId from the Data sheet (CSH vouchers come back as 1)
const DOC_TYPE_ID: Record<VoucherType, number> = { CASH: 1, BANK: 2 };
const PREPARATION_WORKFLOW_ID: Record<VoucherType, number> = { CASH: 2050505, BANK: 2051005 };
const EMPTY_ENTRY: EntryState = {
  AccountID: 0,
  SubLedgerID: 0,
  SubLedgerBankID: 0,
  CostCentreID: 0,
  LocationID: 0,
  Dr: '',
  Cr: '',
  Remarks: '',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Local date → yyyy-mm-dd (toISOString would shift to UTC and can give yesterday's date in IST)
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + n));
}

// Derives the Apr–Mar range from YearShortName ("2026-27", "2026-2027", "26-27").
// Returns null if it can't be parsed, in which case no date limits are applied.
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

// "2026-09-19T00:00:00" → "19-09-2026"
// API dates come as "06/10/2026" (dd/mm/yyyy) — older rows as "2026-09-19T00:00:00"
function apiDateToISO(v?: string | null): string {
  if (!v) return '';
  const dmy = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : '';
}

// Any API date → "06-10-2026"
function formatDisplayDate(v?: string | null): string {
  const iso = apiDateToISO(v);
  if (!iso) return v ?? '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

const voucherNoOf = (v: VoucherRecord) => [v.VoucherSeries, v.VoucherNo].filter(Boolean).join('/');

function parseAmount(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? round2(n) : NaN;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  voucherType: VoucherType;
}
// Search parameters supported by sp_Finance_Query_SelectVoucherAll (KeyName / KeyValue)


export default function CashBankVoucherManager({ voucherType }: Props) {
  const { toast } = useToast();
  const { showModal, modalState, handleClose } = useModal();

  const user = useAppSelector((s) => s.auth.user);
  const dept = (user as any)?.UserDepartment?.[0];
  const companyId: number = dept?.CompanyID ?? 0;
  const companyGroupId: number = dept?.CompanyGroupID ?? 0;
  const financialYearId: number = dept?.FinancialYearID ?? 0;
  const yearShortName: string | undefined = dept?.YearShortName;

  const isBank = voucherType === 'BANK';
  const title = isBank ? 'Bank Voucher' : 'Cash Voucher';

  const fyRange = useMemo(() => getFYRange(yearShortName), [yearShortName]);
  const today = toISODate(new Date());
  const defaultVoucherDate = clampDate(today, fyRange);

  // Masters
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccount[]>([]);
  const [ledgers, setLedgers] = useState<LedgerAccount[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [costCentresByGL, setCostCentresByGL] = useState<Record<number, Option[]>>({});
  const [loadingCostCentres, setLoadingCostCentres] = useState(false);
  const [loading, setLoading] = useState(true);

  // Saved voucher list + the voucher currently loaded into the form
  const [opened, setOpened] = useState<OpenedVoucher | null>(null);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState<VoucherSearch>(EMPTY_SEARCH);
  const [appliedSearch, setAppliedSearch] = useState<VoucherSearch | null>(null); // null = not searched yet
  const [pageNo, setPageNo] = useState(1);
  const [paging, setPaging] = useState({ totalRecords: 0, pageCount: 0 });
  const listRef = useRef<HTMLDivElement>(null);

  // Header
  const [voucherDate, setVoucherDate] = useState(defaultVoucherDate);
  const [cashBankAccountId, setCashBankAccountId] = useState(0);
  const [cashAccountError, setCashAccountError] = useState(false);
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [narration, setNarration] = useState('');

  // Lines
  const [lines, setLines] = useState<VoucherLine[]>([]);
  const [entry, setEntry] = useState<EntryState>(EMPTY_ENTRY);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const emptySnapshot = makeSnapshot({
    voucherDate: defaultVoucherDate,
    cashBankAccountId: 0,
    chequeNo: '',
    chequeDate: '',
    narration: '',
    lines: [],
  });
  const snapshotRef = useRef(emptySnapshot);

  // ── Load masters ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getCashBankAccountsForVoucher(companyId, companyGroupId, financialYearId, voucherType)
        .then((r) => setCashBankAccounts(r?.data?.Accounts ?? [])),
      getCashBankLedgerAccountsForVoucher(companyId, companyGroupId, financialYearId)
        .then((r) => setLedgers(r?.data?.Accounts ?? [])),
      getLocations(companyId, companyGroupId).then((r) => {
        const rows: RawLocation[] = Array.isArray(r?.data) ? r.data : [];
        setLocations(rows.map((l) => ({ id: l.LocationID, label: l.Description })));
      }),
      
    ])
      .catch((err) => toast(getErrorMessage(err, 'Failed to load accounts.'), 'error'))
      .finally(() => setLoading(false));
  }, [companyId, companyGroupId, financialYearId, voucherType]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const cashBankIds = useMemo(
    () => new Set(cashBankAccounts.map((a) => a.AccountID)),
    [cashBankAccounts],
  );
  // Ledger = any GL apart from the cash/bank heads
  const ledgerOptions = useMemo(
    () => ledgers.filter((l) => !cashBankIds.has(l.AccountID)),
    [ledgers, cashBankIds],
  );

  const selectedLedger = ledgerOptions.find((l) => l.AccountID === entry.AccountID);
  const subLedgers = selectedLedger?.SubLedger ?? [];
  // Sub ledger is required only when the selected ledger actually has sub ledgers
  const slRequired = subLedgers.length > 0;
  const selectedSL = subLedgers.find((s) => s.SubLedgerID === entry.SubLedgerID);
  const payToOptions = selectedSL?.SubLedgerBank ?? [];
  const costCentres = costCentresByGL[entry.AccountID] ?? [];



  const accountNameById = useMemo(
    () => new Map(cashBankAccounts.map((a) => [a.AccountID, a.Description])),
    [cashBankAccounts],
  );
  const cashBankNameOf = (v: VoucherRecord) => {
    const leg = v.Posting?.find((p) => cashBankIds.has(p.GLAccountID));
    return leg ? accountNameById.get(leg.GLAccountID) ?? '' : '';
  };

  // Passed vouchers are read-only; everything else (new or opened) is editable
  const readOnly = !!opened?.locked;

  // Lines netting to Dr mean cash/bank goes out (Cr) — a payment; net Cr means a receipt.
  const totals = useMemo(() => {
    const dr = round2(lines.reduce((s, l) => s + l.DrAmount, 0));
    const cr = round2(lines.reduce((s, l) => s + l.CrAmount, 0));
    const net = round2(dr - cr);
    const sign: 'DR' | 'CR' | '' = net > 0 ? 'CR' : net < 0 ? 'DR' : '';
    return { dr, cr, amount: Math.abs(net), sign };
  }, [lines]);

  const chequeMin = addDays(today, 1);
  const chequeMax = fyRange?.end;

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
    patchEntry({ AccountID: accountId, SubLedgerID: 0, SubLedgerBankID: 0, CostCentreID: 0 });
    void ensureCostCentres(accountId);
  };

  const handleSubLedgerChange = (subLedgerId: number) =>
    patchEntry({ SubLedgerID: subLedgerId, SubLedgerBankID: 0 });

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
    const payTo = payToOptions.find((b) => b.SubLedgerBankID === entry.SubLedgerBankID);
    const costCentre = costCentres.find((c) => c.id === entry.CostCentreID);
    const location = locations.find((l) => l.id === entry.LocationID);

    const line: VoucherLine = {
      AccountID: selectedLedger!.AccountID,
      AccountLabel: `${selectedLedger!.Code} — ${selectedLedger!.Description}`,
      SubLedgerID: entry.SubLedgerID,
      SubLedgerLabel: selectedSL?.AccountDescription ?? '',
      SubLedgerBankID: entry.SubLedgerBankID,
      PayToLabel: payTo ? `${payTo.BankAccountName} (${payTo.BankAccountNo})` : '',
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
      SubLedgerBankID: l.SubLedgerBankID,
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

  const isDirty =
    entryIsDirty ||
    makeSnapshot({ voucherDate, cashBankAccountId, chequeNo, chequeDate, narration, lines }) !==
      snapshotRef.current;

  const validateVoucher = (): string | null => {
    if (readOnly) return 'This voucher has been passed and cannot be edited.';
    if (!cashBankAccountId) {
      setCashAccountError(true);
      return `Please select the ${isBank ? 'Bank' : 'Cash'} account at the top of the voucher.`;
    }
    if (!voucherDate) return 'Please enter the voucher date.';
    if (fyRange && (voucherDate < fyRange.start || voucherDate > fyRange.end)) {
      return `Voucher date must be within the financial year (${fyRange.start} to ${fyRange.end}).`;
    }
    if (editingIndex !== null) return 'Finish or cancel the line you are editing first.';
    if (entryIsDirty) return 'The entry row has a line that has not been added yet.';
    if (lines.length === 0) return 'Add at least one line.';
    if (totals.amount === 0) return 'Dr and Cr lines cancel out — the voucher amount cannot be zero.';

    if (isBank) {
      if (chequeNo.trim() && !chequeDate) return 'Please enter the cheque date.';
      if (chequeDate && !chequeNo.trim()) return 'Please enter the cheque number.';
      if (chequeDate) {
        if (chequeDate < chequeMin) return 'Cheque date must be after the current date.';
        if (chequeMax && chequeDate > chequeMax) return 'Cheque date must be within the financial year.';
      }
    }
    return null;
  };

  // Matches sp_Finance_CreateCashBankVoucher @jsonTemplate.
  // The cash/bank leg is sent as the last Posting line so Dr = Cr across all postings.
  // Optional IDs that aren't selected are sent as 0 (not null).
  const buildPayload = () => {
    const toSpDate = (iso: string) => iso.replace(/-/g, '/'); // yyyy-mm-dd → yyyy/mm/dd
    const cashBankSign: 'D' | 'C' = totals.sign === 'DR' ? 'D' : 'C';

    const posting = lines.map((l, i) => ({
      LineNo: i + 1,
      GLAccountID: l.AccountID,
      SLAccountID: l.SubLedgerID || 0,
      CostCenterID: l.CostCentreID || 0,
      LocationID: l.LocationID || 0,
      PayToID: l.SubLedgerBankID || 0,
      Amount: l.DrAmount || l.CrAmount,
      AmountSign: l.DrAmount ? 'D' : 'C',
      LineNarration: l.Remarks,
    }));

    posting.push({
      LineNo: lines.length + 1,
      GLAccountID: cashBankAccountId,
      SLAccountID: 0,
      CostCenterID: 0,
      LocationID: 0,
      PayToID: 0,
      Amount: totals.amount,
      AmountSign: cashBankSign,
      LineNarration: narration.trim(),
    });

    return {
      RecordState: opened ? 2 : 1, // 1 = create, 2 = edit
      DocumentHeaderID: opened?.documentHeaderId ?? 0,
      DocumentType: voucherType,
      WorkflowDocumentID: PREPARATION_WORKFLOW_ID[voucherType],
      BranchCompanyID: companyId,
      GroupCompanyID: companyGroupId,
      FinancialYearID: financialYearId,
      DocumentDate: toSpDate(voucherDate),
      DocumentPreparationDate: toSpDate(today),
      DocumentAmount: totals.amount,
      DRCRFlag: cashBankSign,
      Narration: narration.trim(),
      // Not in the CASH sample; OPENJSON ignores unknown keys, so harmless until the BANK SP reads them
      ...(isBank && {
        ChequeNo: chequeNo.trim(),
        ChequeDate: chequeDate ? toSpDate(chequeDate) : '',
      }),
      Posting: posting,
    };
  };

  const resetForm = () => {
    setVoucherDate(defaultVoucherDate);
    setCashBankAccountId(0);
    setCashAccountError(false);
    setChequeNo('');
    setChequeDate('');
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
      const res = await createCashBankVoucher(buildPayload());
      if (res?.success === false || res?.data?.IsSuccess === false) {
        throw new Error(res?.data?.ErrorDescription || res?.message || 'Failed to save voucher.');
      }
      const savedNo =
        [res?.data?.VoucherSeries, res?.data?.VoucherNo].filter(Boolean).join('/') || opened?.voucherNo || '';
      const verb = opened ? 'updated' : 'saved';
      toast(savedNo ? `Voucher ${savedNo} ${verb} successfully!` : `Voucher ${verb} successfully!`, 'success');
      resetForm();
if (appliedSearch) void loadVouchers(appliedSearch, pageNo);    } catch (e: unknown) {
      toast(getErrorMessage(e, 'Failed to save voucher.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDiscard = (title: string, message: string) =>
    showModal({ title, message, variant: 'warning', confirmText: 'Yes, Discard', cancelText: 'Cancel' });

  const handleClear = async () => {
    if (isDirty) {
      const ok = await confirmDiscard('Clear Voucher', 'This will discard your unsaved changes. Continue?');
      if (!ok) return;
    }
    resetForm();
  };

    // ── Saved voucher list (server-side search + paging) ───────────────────────
  async function loadVouchers(search: VoucherSearch, page: number) {
    setListLoading(true);
    try {
      const r = await getVouchers({
        DocumentTypeID: DOC_TYPE_ID[voucherType],
        BranchCompanyID: companyId,
        GroupCompanyID: companyGroupId,
        FinancialYearID: financialYearId,
        KeyName: search.keyName,
        KeyValue: search.keyValue.trim(),
        PageNo: page,
        PageSize: PAGE_SIZE,
      });
      const d = r?.data;
      if (d?.IsSuccess === false) throw new Error(d?.ErrorDescription || 'Failed to load vouchers.');
      setVouchers(d?.Vouchers ?? []);
      setPaging({ totalRecords: d?.TotalRecords ?? 0, pageCount: d?.PageCount ?? 0 });
      setPageNo(page);
    } catch (err) {
      setVouchers([]);
      setPaging({ totalRecords: 0, pageCount: 0 });
      toast(getErrorMessage(err, 'Failed to load vouchers.'), 'error');
    } finally {
      setListLoading(false);
    }
  }

  const selectedKey = SEARCH_KEYS.find((k) => k.value === searchDraft.keyName);

    // No field selected → list all vouchers (paged). Field selected → its value is required.
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
    setVouchers([]);
    setPaging({ totalRecords: 0, pageCount: 0 });
    setPageNo(1);
  };

  const handlePageChange = (page: number) => {
    if (!appliedSearch || page < 1 || page > paging.pageCount) return;
    void loadVouchers(appliedSearch, page);
  };

  // Footer "Search" → toggles the search parameter section
  const handleSearch = () => {
    setSearchOpen((open) => {
      if (!open) setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return !open;
    });
  };

    const handleOpenVoucher = async (v: VoucherRecord) => {
    if (opened?.documentHeaderId === v.DocumentHeaderID) return;
    if (isDirty) {
      const ok = await confirmDiscard(
        'Open Voucher',
        `You have unsaved changes. Discard them and open ${voucherNoOf(v)}?`,
      );
      if (!ok) return;
    }

    const postings = [...(v.Posting ?? [])].sort((a, b) => a.LineNo - b.LineNo);
    const cashLeg = postings.find((p) => cashBankIds.has(p.GLAccountID));
    const others = postings.filter((p) => p !== cashLeg);

    // Resolve cost-centre names for every GL used on the voucher
    const glIds = [...new Set(others.filter((p) => p.CostCenterID).map((p) => p.GLAccountID))];
    const ccLists = await Promise.all(glIds.map((id) => ensureCostCentres(id)));
    const ccLabel = new Map<string, string>();
    glIds.forEach((id, i) => ccLists[i].forEach((c) => ccLabel.set(`${id}:${c.id}`, c.label)));

    const loaded: VoucherLine[] = others.map((p) => {
      const gl = ledgers.find((l) => l.AccountID === p.GLAccountID);
      const sl = gl?.SubLedger.find((s) => s.SubLedgerID === p.SLAccountID);
      const payTo = sl?.SubLedgerBank.find((b) => b.SubLedgerBankID === p.PayToID);
      return {
        AccountID: p.GLAccountID,
        AccountLabel: gl ? `${gl.Code} — ${gl.Description}` : `GL #${p.GLAccountID}`,
        SubLedgerID: p.SLAccountID ?? 0,
        SubLedgerLabel: sl?.AccountDescription ?? (p.SLAccountID ? `SL #${p.SLAccountID}` : ''),
        SubLedgerBankID: p.PayToID ?? 0,
        PayToLabel: payTo ? `${payTo.BankAccountName} (${payTo.BankAccountNo})` : '',
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

    let sign: OpenedVoucher['sign'] = '';
    if (cashLeg) {
      sign = cashLeg.AmountSign === 'D' ? 'DR' : 'CR';
    } else {
      const net = round2(loaded.reduce((s, l) => s + l.DrAmount - l.CrAmount, 0));
      sign = net > 0 ? 'CR' : net < 0 ? 'DR' : '';
    }

    const header = {
      voucherDate: apiDateToISO(v.DocumentDate),
      cashBankAccountId: cashLeg?.GLAccountID ?? 0,
      chequeNo: v.ChequeNo ?? '',
      chequeDate: apiDateToISO(v.ChequeDate),
      narration: v.Narration ?? '',
    };

    setLines(loaded);
    setEntry(EMPTY_ENTRY);
    setEditingIndex(null);
    setVoucherDate(header.voucherDate);
    setCashBankAccountId(header.cashBankAccountId);
    setCashAccountError(false);
    setNarration(header.narration);
    setChequeNo(header.chequeNo);
    setChequeDate(header.chequeDate);
    setOpened({
      documentHeaderId: v.DocumentHeaderID,
      voucherNo: voucherNoOf(v),
      amount: v.DocumentAmount,
      sign,
      locked: v.IsPassed === true,
    });
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

  const signBadge = (sign: string) =>
    sign ? (
      <span className={cn('badge text-[11px]', sign === 'DR' ? 'badge-blue' : 'badge-green')}>{sign}</span>
    ) : null;

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />

      <PageCard title={title}>
        {/* ── Header ─────────────────────────────────────────────── */}
        {/* Row 1: Voucher No | Date | — | Voucher Amount (right)
            Row 2: Cash/Bank | Cheque No | Cheque Date | Balance (right) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <FormField label="Voucher No">
            <input
              className="form-input readonly"
              readOnly
              value={opened?.voucherNo ?? ''}
              placeholder="Auto-generated"
            />
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
              <span className="text-base font-semibold text-slate-800 tabular-nums">
                {fmt(readOnly && opened ? opened.amount : totals.amount)}
              </span>
              {signBadge(readOnly && opened ? opened.sign : totals.sign)}
            </div>
          </FormField>

          <FormField
            label={isBank ? 'Bank' : 'Cash'}
            required
            error={cashAccountError ? `Select the ${isBank ? 'bank' : 'cash'} account` : undefined}
          >
            <select
              className="form-select"
              value={cashBankAccountId}
              disabled={readOnly}
              onChange={(e) => {
                setCashBankAccountId(Number(e.target.value));
                setCashAccountError(false);
              }}
            >
              <option value={0}>-- Select --</option>
              {cashBankAccounts.map((a) => (
                <option key={a.AccountID} value={a.AccountID}>
                  {a.Code} — {a.Description}
                </option>
              ))}
            </select>
          </FormField>

          {isBank && (
            <>
              <FormField label="Cheque No">
                <input
                  type="text"
                  className="form-input"
                  value={chequeNo}
                  disabled={readOnly}
                  maxLength={20}
                  onChange={(e) => setChequeNo(e.target.value)}
                  placeholder="Enter cheque no"
                />
              </FormField>
              <FormField label="Cheque Date">
                <input
                  type="date"
                  className="form-input"
                  value={chequeDate}
                  disabled={readOnly}
                  min={chequeMin}
                  max={chequeMax}
                  onChange={(e) => setChequeDate(e.target.value)}
                />
              </FormField>
            </>
          )}

          <FormField
            label="Balance"
            hint="Balance lookup not connected yet"
            className="md:col-start-4 md:items-end"
          >
            <div className="h-8 flex items-center gap-2">
              <span className="text-base font-semibold text-slate-400 tabular-nums">—</span>
            </div>
          </FormField>
        </div>

        {opened && (
          <div
            className={cn(
              'rounded-lg border px-4 py-2.5 mb-4 flex items-center gap-2 text-sm',
              opened.locked
                ? 'border-slate-200 bg-slate-50 text-slate-700'
                : 'border-amber-200 bg-amber-50 text-amber-800',
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
                {ledgerOptions.map((l) => (
                  <option key={l.AccountID} value={l.AccountID}>
                    {l.Code} — {l.Description}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Sub Ledger"
              required={slRequired}
            >
              <select
                className="form-select"
                value={entry.SubLedgerID}
                disabled={!slRequired}
                onChange={(e) => handleSubLedgerChange(Number(e.target.value))}
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

            <FormField label="Pay To">
              <select
                className="form-select"
                value={entry.SubLedgerBankID}
                disabled={payToOptions.length === 0}
                onChange={(e) => patchEntry({ SubLedgerBankID: Number(e.target.value) })}
              >
                <option value={0}>
                  {!selectedSL ? '-- Select Sub Ledger first --' : payToOptions.length === 0 ? 'No bank accounts' : '-- Select --'}
                </option>
                {payToOptions.map((b) => (
                  <option key={b.SubLedgerBankID} value={b.SubLedgerBankID}>
                    {b.BankAccountName} ({b.BankAccountNo})
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
                  <th>Pay To</th>
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
                    <td colSpan={10} className="py-10 text-center text-slate-400 text-sm">
                      No lines added yet
                    </td>
                  </tr>
                ) : (
                  lines.map((l, idx) => (
                    <tr key={idx} className={cn(editingIndex === idx && 'bg-amber-50')}>
                      <td className="text-slate-400">{idx + 1}</td>
                      <td className="font-medium text-slate-800">{l.AccountLabel}</td>
                      <td>{l.SubLedgerLabel || <span className="text-slate-300">—</span>}</td>
                      <td className="text-xs">{l.PayToLabel || <span className="text-slate-300">—</span>}</td>
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
                    <td colSpan={5} className="px-4 py-2 text-right text-slate-500">Total</td>
                    <td className="px-4 py-2 text-right text-blue-700">{fmt(totals.dr)}</td>
                    <td className="px-4 py-2 text-right text-emerald-700">{fmt(totals.cr)}</td>
                    <td colSpan={3} className="px-4 py-2 text-xs text-slate-500">
                      {isBank ? 'Bank' : 'Cash'} {totals.sign === 'CR' ? 'Cr.' : totals.sign === 'DR' ? 'Dr.' : ''}{' '}
                      {fmt(totals.amount)}
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
              <FormField label="Search By"  className="w-full sm:w-52">
                <select
                  className="form-select"
                  value={searchDraft.keyName}
                  onChange={(e) =>
                    setSearchDraft({ keyName: e.target.value as VoucherSearchKey | '', keyValue: '' })
                  }
                >
                  <option value="">All Vouchers</option>
                  {SEARCH_KEYS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </FormField>

<FormField label={selectedKey?.label ?? 'Value'} required={!!selectedKey} className="w-full sm:w-60">                <input
                  type={selectedKey?.kind === 'date' ? 'date' : selectedKey?.kind === 'number' ? 'number' : 'text'}
                  min={selectedKey?.kind === 'number' ? 1 : undefined}
                  className="form-input"
                  value={searchDraft.keyValue}
                  disabled={!selectedKey}
placeholder={selectedKey ? selectedKey.placeholder : 'Not needed for All Vouchers'}                  onChange={(e) => setSearchDraft((f) => ({ ...f, keyValue: e.target.value }))}
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
                          <th>{isBank ? 'Bank' : 'Cash'}</th>
                          <th className="text-right">Amount</th>
                          <th>Narration</th>
                          <th className="text-center">Lines</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listLoading ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">
                              <Loader2 size={14} className="animate-spin inline mr-2" />
                              Loading vouchers…
                            </td>
                          </tr>
                        ) : vouchers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">
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
                              <td>{cashBankNameOf(v) || <span className="text-slate-300">—</span>}</td>
                              <td className="text-right tabular-nums">{fmt(v.DocumentAmount)}</td>
                              <td className="text-xs text-slate-500">{v.Narration}</td>
                              <td className="text-center">{v.Posting?.length ?? 0}</td>
                              <td className="text-center">
                                {v.IsPassed ? (
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
                      <span>
                        Page {pageNo} of {paging.pageCount}
                      </span>
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