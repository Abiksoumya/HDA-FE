import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, RotateCcw, X, CheckCircle2, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';
import { usePageButtons } from '@/hooks/usePageButtons';
import {
  getCashBankAccountsForVoucher,
  getCashBankLedgerAccountsForVoucher,
  createCashBankVoucher,
  getVouchers,
} from '@/apis/finance/financeApi';
import PageCard from '@/components/shared/PageCard';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/panels/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

// ── Types ────────────────────────────────────────────────────────────────────

export type VoucherType = 'CASH' | 'BANK';

interface CashBankAccount { AccountID: number; Code: string; Description: string; }
interface SubLedgerBank { SubLedgerBankID: number; BankAccountNo: string; BankAccountName: string; }
interface SubLedger { SubLedgerID: number; AccountCode: string; AccountDescription: string; SubLedgerBank: SubLedgerBank[]; }
interface LedgerAccount { AccountID: number; Code: string; Description: string; GLSLFlag: string; SubLedger: SubLedger[]; }

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
  DocumentPreparationDate?: string;
  DocumentAmount: number;
  Narration: string | null;
  ChequeNo?: string | null;
  ChequeDate?: string | null;
  Posting: VoucherPosting[];
}

// One editable line on the pass form (cash/bank leg excluded — it is recalculated)
interface PassLine {
  posting: VoucherPosting;
  ledgerLabel: string;
  subLedgerLabel: string;
  payToLabel: string;
  side: 'D' | 'C'; // fixed — the passer may change the amount, not the side
  amount: string;
}

interface OpenedVoucher {
  record: VoucherRecord;
  cashLeg: VoucherPosting;
  passed: boolean; // opened from the passed list → read-only
}

type ListKind = 'PASSED' | 'PENDING';

type VoucherSearchKey = 'DocumentHeaderID' | 'VoucherNo' | 'VoucherSeries' | 'DocumentDate' | 'ChequeNo' | 'EntryDate';

const SEARCH_KEYS: { value: VoucherSearchKey; label: string; kind: 'text' | 'number' | 'date'; placeholder?: string }[] = [
  { value: 'VoucherNo', label: 'Voucher No', kind: 'text', placeholder: 'e.g. 000007' },
  { value: 'VoucherSeries', label: 'Voucher Series', kind: 'text', placeholder: 'e.g. CSH/20261006' },
  { value: 'DocumentDate', label: 'Voucher Date', kind: 'date' },
  { value: 'EntryDate', label: 'Entry Date', kind: 'date' },
  { value: 'ChequeNo', label: 'Cheque No', kind: 'text', placeholder: 'Enter cheque no' },
  { value: 'DocumentHeaderID', label: 'Document ID', kind: 'number', placeholder: 'e.g. 14' },
];

interface VoucherSearch { keyName: VoucherSearchKey | ''; keyValue: string; }
const EMPTY_SEARCH: VoucherSearch = { keyName: '', keyValue: '' };

const PAGE_SIZE = 10;
const DOC_TYPE_ID: Record<VoucherType, number> = { CASH: 1, BANK: 2 };

// Workflow stages (menu IDs)
const WORKFLOW: Record<VoucherType, { prepared: number; passed: number }> = {
  CASH: { prepared: 2050505, passed: 2050510 },
  BANK: { prepared: 2051005, passed: 2051010 },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const voucherNoOf = (v: VoucherRecord) => [v.VoucherSeries, v.VoucherNo].filter(Boolean).join('/');

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

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  voucherType: VoucherType;
}

export default function CashBankVoucherPass({ voucherType }: Props) {
  const { toast } = useToast();
  const { showModal, modalState, handleClose } = useModal();
  const buttons = usePageButtons();
  const canPass = buttons.includes('Approve') || buttons.includes('Submit');
  const canClose = buttons.includes('Close');

  const user = useAppSelector((s) => s.auth.user);
  const dept = (user as any)?.UserDepartment?.[0];
  const companyId: number = dept?.CompanyID ?? 0;
  const companyGroupId: number = dept?.CompanyGroupID ?? 0;
  const financialYearId: number = dept?.FinancialYearID ?? 0;

  const isBank = voucherType === 'BANK';
  const title = isBank ? 'Bank Voucher' : 'Cash Voucher';
  const workflow = WORKFLOW[voucherType];

  // Masters
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccount[]>([]);
  const [ledgers, setLedgers] = useState<LedgerAccount[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);

  // List
  const [listKind, setListKind] = useState<ListKind>('PASSED');
  const [searchDraft, setSearchDraft] = useState<VoucherSearch>(EMPTY_SEARCH);
  const [appliedSearch, setAppliedSearch] = useState<VoucherSearch>(EMPTY_SEARCH);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [paging, setPaging] = useState({ totalRecords: 0, pageCount: 0 });

  // Opened voucher
  const [opened, setOpened] = useState<OpenedVoucher | null>(null);
  const [lines, setLines] = useState<PassLine[]>([]);
  const [originalAmounts, setOriginalAmounts] = useState<string[]>([]);
  const [passing, setPassing] = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) {
      setMastersLoading(false);
      return;
    }
    Promise.all([
      getCashBankAccountsForVoucher(companyId, companyGroupId, financialYearId, voucherType).then((r) =>
        setCashBankAccounts(r?.data?.Accounts ?? []),
      ),
      getCashBankLedgerAccountsForVoucher(companyId, companyGroupId, financialYearId).then((r) =>
        setLedgers(r?.data?.Accounts ?? []),
      ),
    ])
      .catch((err) => toast(getErrorMessage(err, 'Failed to load accounts.'), 'error'))
      .finally(() => setMastersLoading(false));

    // Initial list: passed vouchers, no search
    void loadVouchers('PASSED', EMPTY_SEARCH, 1);
  }, [companyId, companyGroupId, financialYearId, voucherType]);

  async function loadVouchers(kind: ListKind, search: VoucherSearch, page: number) {
    setListLoading(true);
    try {
      const r = await getVouchers({
        DocumentTypeID: DOC_TYPE_ID[voucherType],
        BranchCompanyID: companyId,
        GroupCompanyID: companyGroupId,
        FinancialYearID: financialYearId,
        WorkflowDocumentID: kind === 'PASSED' ? workflow.passed : workflow.prepared,
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
      setListKind(kind);
      setAppliedSearch(search);
    } catch (err) {
      setVouchers([]);
      setPaging({ totalRecords: 0, pageCount: 0 });
      toast(getErrorMessage(err, 'Failed to load vouchers.'), 'error');
    } finally {
      setListLoading(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const cashBankIds = useMemo(() => new Set(cashBankAccounts.map((a) => a.AccountID)), [cashBankAccounts]);
  const cashNameById = useMemo(
    () => new Map(cashBankAccounts.map((a) => [a.AccountID, `${a.Code} — ${a.Description}`])),
    [cashBankAccounts],
  );
  const selectedKey = SEARCH_KEYS.find((k) => k.value === searchDraft.keyName);

  const totals = useMemo(() => {
    let dr = 0;
    let cr = 0;
    for (const l of lines) {
      const n = Number(l.amount);
      if (!Number.isFinite(n)) continue;
      if (l.side === 'D') dr += n;
      else cr += n;
    }
    dr = round2(dr);
    cr = round2(cr);
    const net = round2(dr - cr);
    // Lines net Dr → cash goes out (Cr); lines net Cr → cash comes in (Dr)
    const cashSign: 'D' | 'C' | '' = net > 0 ? 'C' : net < 0 ? 'D' : '';
    return { dr, cr, amount: Math.abs(net), cashSign };
  }, [lines]);

  const readOnly = !opened || opened.passed;
  const isDirty = lines.some((l, i) => l.amount !== originalAmounts[i]);

  // ── List actions ───────────────────────────────────────────────────────────
  const confirmDiscard = async () => {
    if (!isDirty) return true;
    return showModal({
      title: 'Discard Changes',
      message: 'You have changed amounts on the open voucher. Discard them?',
      variant: 'warning',
      confirmText: 'Yes, Discard',
      cancelText: 'Cancel',
    });
  };

  // Search → vouchers waiting to be passed. No field selected = all of them.
  const handleSearch = () => {
    if (searchDraft.keyName && !searchDraft.keyValue.trim()) {
      toast(`Please enter the ${selectedKey?.label ?? 'search value'}.`, 'error');
      return;
    }
    void loadVouchers('PENDING', { ...searchDraft, keyValue: searchDraft.keyValue.trim() }, 1);
  };

  // Reset → back to the passed list
  const handleReset = () => {
    setSearchDraft(EMPTY_SEARCH);
    void loadVouchers('PASSED', EMPTY_SEARCH, 1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > paging.pageCount) return;
    void loadVouchers(listKind, appliedSearch, page);
  };

  const closeVoucher = () => {
    setOpened(null);
    setLines([]);
    setOriginalAmounts([]);
  };

  const handleCloseVoucher = async () => {
    if (!(await confirmDiscard())) return;
    closeVoucher();
  };

  const handleOpenVoucher = async (v: VoucherRecord) => {
    if (opened?.record.DocumentHeaderID === v.DocumentHeaderID) return;
    if (!(await confirmDiscard())) return;

    const postings = [...(v.Posting ?? [])].sort((a, b) => a.LineNo - b.LineNo);
    const cashLeg = postings.find((p) => cashBankIds.has(p.GLAccountID));
    if (!cashLeg) {
      toast(`${voucherNoOf(v)} has no ${isBank ? 'bank' : 'cash'} account line and cannot be opened here.`, 'error');
      return;
    }

    const passLines: PassLine[] = postings
      .filter((p) => p !== cashLeg)
      .map((p) => {
        const gl = ledgers.find((l) => l.AccountID === p.GLAccountID);
        const sl = gl?.SubLedger.find((s) => s.SubLedgerID === p.SLAccountID);
        const payTo = sl?.SubLedgerBank.find((b) => b.SubLedgerBankID === p.PayToID);
        return {
          posting: p,
          ledgerLabel: gl ? `${gl.Code} — ${gl.Description}` : `GL #${p.GLAccountID}`,
          subLedgerLabel: sl?.AccountDescription ?? (p.SLAccountID ? `SL #${p.SLAccountID}` : ''),
          payToLabel: payTo ? `${payTo.BankAccountName} (${payTo.BankAccountNo})` : '',
          side: p.AmountSign,
          amount: String(p.Amount),
        };
      });

    setOpened({ record: v, cashLeg, passed: listKind === 'PASSED' });
    setLines(passLines);
    setOriginalAmounts(passLines.map((l) => l.amount));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Pass ───────────────────────────────────────────────────────────────────
  const handleAmountChange = (index: number, value: string) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, amount: value } : l)));

  const validate = (): string | null => {
    if (!opened || opened.passed) return 'Open a voucher waiting to be passed first.';
    for (let i = 0; i < lines.length; i++) {
      const n = Number(lines[i].amount);
      if (!lines[i].amount || !Number.isFinite(n) || n <= 0) return `Line ${i + 1}: enter an amount greater than 0.`;
    }
    if (totals.amount === 0) return 'Dr and Cr lines cancel out — the voucher amount cannot be zero.';
    return null;
  };

  const buildPayload = () => {
    const { record, cashLeg } = opened!;
    const posting = [...lines.map((l) => l.posting), cashLeg]
      .sort((a, b) => a.LineNo - b.LineNo)
      .map((p) => {
        const line = lines.find((l) => l.posting === p);
        const isCash = p === cashLeg;
        return {
          LineNo: p.LineNo,
          GLAccountID: p.GLAccountID,
          SLAccountID: p.SLAccountID || 0,
          CostCenterID: p.CostCenterID || 0,
          LocationID: p.LocationID || 0,
          PayToID: p.PayToID || 0,
          Amount: isCash ? totals.amount : round2(Number(line!.amount)),
          AmountSign: isCash ? (totals.cashSign as 'D' | 'C') : p.AmountSign,
          LineNarration: p.LineNarration ?? '',
        };
      });

    const docDate = apiDateToISO(record.DocumentDate);
    const prepDate = apiDateToISO(record.DocumentPreparationDate) || docDate;

    return {
      RecordState: 2,
      DocumentHeaderID: record.DocumentHeaderID,
      DocumentType: voucherType,
      WorkflowDocumentID: workflow.passed,
      BranchCompanyID: companyId,
      GroupCompanyID: companyGroupId,
      FinancialYearID: financialYearId,
      DocumentDate: toSpDate(docDate),
      DocumentPreparationDate: toSpDate(prepDate),
      DocumentAmount: totals.amount,
      DRCRFlag: totals.cashSign,
      Narration: record.Narration ?? '',
      ...(isBank && {
        ChequeNo: record.ChequeNo ?? '',
        ChequeDate: record.ChequeDate ? toSpDate(apiDateToISO(record.ChequeDate)) : '',
      }),
      Posting: posting,
    };
  };

  const handlePass = async () => {
    const err = validate();
    if (err) {
      toast(err, 'error');
      return;
    }
    const voucherNo = voucherNoOf(opened!.record);
    const ok = await showModal({
      title: 'Pass Voucher',
      message: `Pass voucher ${voucherNo} for ₹${fmt(totals.amount)}?`,
      variant: 'success',
      confirmText: 'Yes, Pass',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    setPassing(true);
    try {
      const res = await createCashBankVoucher(buildPayload());
      if (res?.success === false || res?.data?.IsSuccess === false) {
        throw new Error(res?.data?.ErrorDescription || res?.message || 'Failed to pass voucher.');
      }
      toast(`Voucher ${voucherNo} passed successfully!`, 'success');
      closeVoucher();
      void loadVouchers(listKind, appliedSearch, pageNo);
    } catch (e) {
      toast(getErrorMessage(e, 'Failed to pass voucher.'), 'error');
    } finally {
      setPassing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const signBadge = (sign: 'D' | 'C' | '') =>
    sign ? (
      <span className={cn('badge text-[11px]', sign === 'D' ? 'badge-blue' : 'badge-green')}>
        {sign === 'D' ? 'DR' : 'CR'}
      </span>
    ) : null;

  const record = opened?.record;

  return (
    <>
      <Modal {...modalState} isOpen={modalState.isOpen} onClose={handleClose} />

      {/* ── Opened voucher ───────────────────────────────────────── */}
      {opened && record && (
        <PageCard title={`${title} Pass`} className="mb-4">
          <div
            className={cn(
              'rounded-lg border px-4 py-2.5 mb-4 flex items-center gap-2 text-sm',
              opened.passed
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800',
            )}
          >
            {opened.passed ? <Lock size={14} /> : <CheckCircle2 size={14} />}
            {opened.passed ? 'Passed voucher' : 'Passing voucher'}{' '}
            <span className="font-semibold">{voucherNoOf(record)}</span>
            {opened.passed ? ' — read-only.' : ' — only Dr / Cr amounts can be changed.'}
          </div>

          {/* Header (read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <FormField label="Voucher No">
              <input className="form-input readonly" readOnly value={voucherNoOf(record)} />
            </FormField>
            <FormField label="Date">
              <input className="form-input readonly" readOnly value={formatDisplayDate(record.DocumentDate)} />
            </FormField>
            <FormField label={isBank ? 'Bank' : 'Cash'}>
              <input
                className="form-input readonly"
                readOnly
                value={cashNameById.get(opened.cashLeg.GLAccountID) ?? `GL #${opened.cashLeg.GLAccountID}`}
              />
            </FormField>
            <FormField label="Voucher Amount" className="md:items-end">
              <div className="h-8 flex items-center gap-2">
                <span className="text-base font-semibold text-slate-800 tabular-nums">{fmt(totals.amount)}</span>
                {signBadge(totals.cashSign)}
              </div>
            </FormField>
            {isBank && (
              <>
                <FormField label="Cheque No">
                  <input className="form-input readonly" readOnly value={record.ChequeNo ?? ''} />
                </FormField>
                <FormField label="Cheque Date">
                  <input className="form-input readonly" readOnly value={formatDisplayDate(record.ChequeDate)} />
                </FormField>
              </>
            )}
          </div>

          {/* Lines */}
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
                    <th className="text-right w-36">Dr.</th>
                    <th className="text-right w-36">Cr.</th>
                    <th>Remarks</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => {
                    const changed = l.amount !== originalAmounts[idx];
                    const amountCell = (side: 'D' | 'C') =>
                      l.side !== side ? null : readOnly ? (
                        <span className="tabular-nums">{fmt(Number(l.amount) || 0)}</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className={cn(
                            'form-input text-right h-7 w-28 ml-auto',
                            changed && 'border-amber-400 bg-amber-50',
                          )}
                          value={l.amount}
                          onChange={(e) => handleAmountChange(idx, e.target.value)}
                        />
                      );
                    return (
                      <tr key={l.posting.LineNo}>
                        <td className="text-slate-400">{idx + 1}</td>
                        <td className="font-medium text-slate-800">{l.ledgerLabel}</td>
                        <td>{l.subLedgerLabel || <span className="text-slate-300">—</span>}</td>
                        <td className="text-xs">{l.payToLabel || <span className="text-slate-300">—</span>}</td>
                        <td>{l.posting.CostCenter || <span className="text-slate-300">—</span>}</td>
                        <td className="text-right text-blue-700">{amountCell('D')}</td>
                        <td className="text-right text-emerald-700">{amountCell('C')}</td>
                        <td className="text-xs text-slate-500">{l.posting.LineNarration}</td>
                        <td>{l.posting.Location || <span className="text-slate-300">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-sm">
                    <td colSpan={5} className="px-4 py-2 text-right text-slate-500">Total</td>
                    <td className="px-4 py-2 text-right text-blue-700">{fmt(totals.dr)}</td>
                    <td className="px-4 py-2 text-right text-emerald-700">{fmt(totals.cr)}</td>
                    <td colSpan={2} className="px-4 py-2 text-xs text-slate-500">
                      {isBank ? 'Bank' : 'Cash'} {totals.cashSign === 'D' ? 'Dr.' : totals.cashSign === 'C' ? 'Cr.' : ''}{' '}
                      {fmt(totals.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <FormField label="Narration">
            <textarea rows={2} className="form-textarea bg-slate-50" readOnly value={record.Narration ?? ''} />
          </FormField>

          <div className="flex justify-end gap-2 mt-4">
            {canClose && (
              <Button variant="secondary" type="button" onClick={handleCloseVoucher}>
                <X size={13} /> Close
              </Button>
            )}
            {canPass && !opened.passed && (
              <Button variant="success" type="button" onClick={handlePass} disabled={passing}>
                <CheckCircle2 size={13} /> {passing ? 'Passing…' : 'Pass'}
              </Button>
            )}
          </div>
        </PageCard>
      )}

      {/* ── Search + list ────────────────────────────────────────── */}
      <PageCard title={`${title} Pass`} showBackButton={!opened}>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="button" onClick={handleSearch} disabled={listLoading}>
              <Search size={13} /> Search
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={listLoading}>
              <RotateCcw size={13} /> Reset
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn('badge text-[11px]', listKind === 'PASSED' ? 'badge-green' : 'badge-amber')}
          >
            {listKind === 'PASSED' ? 'Passed vouchers' : 'Waiting to be passed'}
          </span>
          {listKind === 'PENDING' && (
            <span className="text-xs text-slate-400">Click Reset to go back to passed vouchers</span>
          )}
        </div>

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
                {listLoading || mastersLoading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">
                      <Loader2 size={14} className="animate-spin inline mr-2" />
                      Loading vouchers…
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-sm">
                      {listKind === 'PASSED' ? 'No passed vouchers yet' : 'No vouchers waiting to be passed'}
                    </td>
                  </tr>
                ) : (
                  vouchers.map((v, idx) => {
                    const leg = v.Posting?.find((p) => cashBankIds.has(p.GLAccountID));
                    const cashName = leg ? cashBankAccounts.find((a) => a.AccountID === leg.GLAccountID)?.Description : '';
                    return (
                      <tr
                        key={v.DocumentHeaderID}
                        onDoubleClick={() => handleOpenVoucher(v)}
                        className={cn(
                          'cursor-pointer select-none hover:bg-blue-50',
                          opened?.record.DocumentHeaderID === v.DocumentHeaderID && 'bg-amber-50',
                        )}
                        title="Double-click to open"
                      >
                        <td className="text-slate-400">{(pageNo - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="font-medium text-slate-800">{voucherNoOf(v)}</td>
                        <td>{formatDisplayDate(v.DocumentDate)}</td>
                        <td>{cashName || <span className="text-slate-300">—</span>}</td>
                        <td className="text-right tabular-nums">{fmt(v.DocumentAmount)}</td>
                        <td className="text-xs text-slate-500">{v.Narration}</td>
                        <td className="text-center">{v.Posting?.length ?? 0}</td>
                        <td className="text-center">
                          {listKind === 'PASSED' ? (
                            <span className="badge badge-green text-[11px]">Passed</span>
                          ) : (
                            <span className="badge badge-blue text-[11px]">Prepared</span>
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
      </PageCard>
    </>
  );
}