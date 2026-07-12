

import { useState, useEffect } from 'react';
import {
  Users, UserCircle, ChevronRight, ChevronLeft,
  Check, Save, X, Settings2, Loader2,
} from 'lucide-react';
import PageCard from '@/components/shared/PageCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { getGroupRoles, getGroupUsers, getRoles, saveGroupRoles, saveRoles, type ApiMenu, type RolesResponse } from '@/apis/master/roleApi';
import { getAllGroups } from '@/apis/master/groupApi';
import { getAllUsers } from '@/apis/master/userApi';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/hooks/redux';

// ── Types ──────────────────────────────────────────────────
interface MenuRow {
  MenuID: number;
  ParentID: number;
  ParentMenuName: string;
  MenuName: string;
  ModuleID: number;
  GroupFlag: string;
  LevelNo: number;
  active: boolean;
  amountLimit: number;
  apprvapp: number;
  buttons: Record<string, boolean>;
}

interface GroupOption {
  GroupID: number;
  GroupName: string;
  CompanyID: number;
  GroupCompanyID: number;
}

interface UserOption {
  UserID: number;
  UserName: string;
  UserLoginID: string;
}


function transformMenus(apiMenus: ApiMenu[], isUserTab = false): MenuRow[] {
  // Build parent name map for ALL menus
  const parentMap: Record<number, string> = {};
  apiMenus.forEach((m) => {
    parentMap[m.MenuID] = m.MenuName;
  });

  // Include ALL menus — both GroupFlag='Y' (parent) and GroupFlag='N' (leaf)
  return apiMenus.map((m) => {
    const buttons: Record<string, boolean> = {};

    if (isUserTab) {
      const activeButtons = new Set(
        (m.ButtonRights ?? [])
          .filter((b) => b.IsButtonMapped === true || b.IsButtonActive === true)
          .map((b) => b.ButtonName)
      );
      (m.MenuButtons ?? []).forEach((b: { ButtonName: string }) => {
        buttons[b.ButtonName] = activeButtons.has(b.ButtonName);
      });
    } else {
      const activeButtons = new Set(
        (m.ButtonRights ?? [])
          .filter((b) => b.IsButtonMapped || b.IsButtonActive)
          .map((b: { ButtonName: string }) => b.ButtonName)
      );
      if (m.MenuButtons && m.MenuButtons.length > 0) {
        m.MenuButtons.forEach((b: { ButtonName: string }) => {
          buttons[b.ButtonName] = activeButtons.has(b.ButtonName);
        });
      } else if (m.Buttons && m.Buttons.length > 0) {
        m.Buttons.forEach((b: { ButtonName: string; IsButtonMapped: boolean }) => {
          buttons[b.ButtonName] = b.IsButtonMapped;
        });
      }
    }

    return {
      MenuID: m.MenuID,
      ParentID: m.ParentID,
      ParentMenuName: m.ParentID ? (parentMap[m.ParentID] ?? '') : '—', // top-level shows '—'
      MenuName: m.MenuName,
      ModuleID: m.ModuleID,
      GroupFlag: m.GroupFlag, // ← keep for submit payload
      LevelNo: m.LevelNo,
      active: isUserTab
        ? Boolean(m.IsMapped)
        : Boolean(m.IsEnable === true || m.IsEnable === 1),
      amountLimit: m.AmountLimit,
      apprvapp: m.APPRVAPP,
      buttons,
    };
  });
}

// ── Toggle ─────────────────────────────────────────────────
function Toggle({
  value, onChange, disabled = false,
}: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={cn(
        'relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 select-none',
        value ? 'bg-emerald-500' : 'bg-slate-300',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      <span className={cn('absolute text-[9px] font-bold text-white', value ? 'left-1.5' : 'right-1.5')}>
        {value ? 'YES' : 'NO'}
      </span>
      <span className={cn(
        'absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
        value ? 'translate-x-7' : 'translate-x-1',
      )} />
    </button>
  );
}

// ── Step Indicator ─────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Menu Selection', 'Button Permissions', 'Review & Confirm'];
  return (
    <div className="flex items-center mb-6">
      {steps.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                isActive ? 'bg-blue-600 border-blue-600 text-white' :
                'bg-white border-slate-300 text-slate-400',
              )}>
                {isDone ? <Check size={14} /> : step}
              </div>
              <span className={cn(
                'text-[11px] mt-1 font-medium whitespace-nowrap',
                isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400',
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 w-24 mx-2 mb-4 transition-colors',
                isDone ? 'bg-emerald-400' : 'bg-slate-200',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Button Permission Popup ────────────────────────────────
function ButtonPermissionModal({
  menu, buttons, onClose, onSave,
}: {
  menu: string;
  buttons: Record<string, boolean>;
  onClose: () => void;
  onSave: (b: Record<string, boolean>) => void;
}) {
  const [local, setLocal] = useState({ ...buttons });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Button Permissions</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{menu}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={15} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {Object.keys(local).map((btn) => (
            <div key={btn} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{btn}</span>
              <Toggle value={local[btn]} onChange={(v) => setLocal((p) => ({ ...p, [btn]: v }))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}><X size={12} /> Cancel</Button>
          <Button size="sm" onClick={() => { onSave(local); onClose(); }}><Save size={12} /> Save</Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 1 ─────────────────────────────────────────────────
function Step1({ menus, onChange }: {
  menus: MenuRow[];
  
  onChange: (id: number, field: keyof MenuRow, value: unknown) => void;
}) {
  // console.log('First menu row:', menus[0]);

  const activeCount = menus.filter((m) => m.active).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">Toggle menus active or inactive.</p>
        {activeCount > 0 && <span className="badge badge-green text-[11px]">{activeCount} active</span>}
      </div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm table-fixed">
  <thead>
    <tr className="bg-slate-50 border-b border-slate-200">
      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">
        Parent Menu
      </th>
      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">
        Menu
      </th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">
        Active
      </th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/4">
        Value Limit
      </th>
    </tr>
  </thead>
          <tbody>
            {menus.map((row) => (
  <tr key={row.MenuID} className={cn(
    'border-b border-slate-100 last:border-0 transition-colors',
    row.active ? 'bg-blue-50/40' : 'hover:bg-slate-50',
  )}>
    <td className="px-4 py-3 text-xs text-slate-400 font-medium">{row.ParentMenuName}</td>
    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{row.MenuName}</td>

    {/* Active */}
    <td className="px-4 py-3 text-center">
      <Toggle
        value={row.active}
        onChange={(v) => {
          onChange(row.MenuID, 'active', v);
          if (!v) {
            onChange(row.MenuID, 'buttons',
              Object.fromEntries(Object.keys(row.buttons).map((b) => [b, false]))
            );
            onChange(row.MenuID, 'amountLimit', 0); // ← reset value limit when inactive
          }
        }}
      />
    </td>

    {/* Value Limit — only enabled when Active = YES */}
    <td className="px-4 py-3 text-center">
      <input
        type="number"
        value={row.amountLimit}
        onChange={(e) => onChange(row.MenuID, 'amountLimit', Number(e.target.value))}
        disabled={!row.active}
        min={0}
        className={cn(
          'w-24 h-7 text-center text-sm rounded-md border border-slate-200 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500',
          'disabled:opacity-40 disabled:bg-slate-50 disabled:cursor-not-allowed',
        )}
      />
    </td>
  </tr>
))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Step 2 ─────────────────────────────────────────────────
function Step2({ globalButtons, onChange }: {
  globalButtons: Record<string, boolean>;
  onChange: (b: Record<string, boolean>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-4">
        Set button permissions. These will apply to all active menus.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-72 mx-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Button Permissions</p>
          <p className="text-xs text-slate-400 mt-0.5">Applies to all active menus</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {Object.keys(globalButtons).map((btn) => (
            <div key={btn} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{btn}</span>
              <Toggle
                value={globalButtons[btn]}
                onChange={(v) => onChange({ ...globalButtons, [btn]: v })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3 ─────────────────────────────────────────────────
function Step3({ menus, onChange }: {
  menus: MenuRow[];
  onChange: (id: number, field: keyof MenuRow, value: unknown) => void;
}) {
  const [popupMenu, setPopupMenu] = useState<MenuRow | null>(null);
  const activeMenus = menus.filter((m) => m.active);

  return (
    <>
      {popupMenu && (
        <ButtonPermissionModal
          menu={popupMenu.MenuName}
          buttons={popupMenu.buttons}
          onClose={() => setPopupMenu(null)}
          onSave={(buttons) => { onChange(popupMenu.MenuID, 'buttons', buttons); setPopupMenu(null); }}
        />
      )}
      <div className="space-y-3">
        <p className="text-xs text-slate-500 mb-2">
          Review all active menus. Click ⚙ to modify button permissions per menu.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Parent Menu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Menu</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Active</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Assigned Buttons</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Edit</th>
              </tr>
            </thead>
            <tbody>
              {activeMenus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                    No active menus. Go back to Step 1.
                  </td>
                </tr>
              ) : (
                activeMenus.map((row) => (
                  <tr key={row.MenuID} className="border-b border-slate-100 last:border-0 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 font-medium">{row.ParentMenuName}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{row.MenuName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge badge-green">Yes</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Object.entries(row.buttons).filter(([, v]) => v).map(([b]) => (
                          <span key={b} className="badge badge-blue text-[9px]">{b}</span>
                        ))}
                        {Object.values(row.buttons).every((v) => !v) && (
                          <span className="text-xs text-slate-300">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPopupMenu(row)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Settings2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Group Tab ──────────────────────────────────────────────
function GroupTab() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [globalButtons, setGlobalButtons] = useState<Record<string, boolean>>({
    Approve: false, Close: false, Search: false, Submit: false,
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rolesData, setRolesData] = useState<RolesResponse | null>(null);

  // Load all groups on mount
  useEffect(() => {
    getAllGroups(1, 100)
      .then((r) => setGroups(r?.data?.Group ?? []))
      .catch(() => setGroups([]));
  }, []);

    const loadRoles = async (groupId: number) => {
  const grp = groups.find((g) => g.GroupID === groupId);
  const companyId = grp?.CompanyID ?? 0;
  setLoading(true);
  try {
    const res = await getGroupRoles(companyId, groupId);
    const data = res?.data;
    setRolesData(data);
    const transformed = transformMenus(data?.Menu ?? [], false);
    setMenus(transformed);
    setStep(1);

    // ← Pre-populate globalButtons from first active menu's ButtonRights
    const firstActiveMenu = data?.Menu?.find(
      (m: ApiMenu) => m.GroupFlag === 'N' && m.IsEnable
    );
    if (firstActiveMenu?.ButtonRights?.length > 0) {
      const preButtons: Record<string, boolean> = {};
      firstActiveMenu.ButtonRights.forEach((b: { ButtonName: string; IsButtonMapped: boolean }) => {
        preButtons[b.ButtonName] = b.IsButtonMapped;
      });
      setGlobalButtons(preButtons);
    } else {
      setGlobalButtons({ Approve: false, Close: false, Search: false, Submit: false });
    }

  } catch {
    setMenus([]);
  } finally {
    setLoading(false);
  }
};


  const handleMenuChange = (id: number, field: keyof MenuRow, value: unknown) => {
    setMenus((prev) => prev.map((m) => m.MenuID === id ? { ...m, [field]: value } : m));
  };

  const handleNext = () => {
    if (step === 2) {
      setMenus((prev) => prev.map((m) =>
        m.active ? { ...m, buttons: { ...globalButtons } } : m
      ));
    }
    setStep((s) => s + 1);
  };

  const handleFinalSubmit = async () => {
  if (!rolesData) return;
  setSaving(true);
  try {
    const payload = {
      CompanyID: rolesData.CompanyID,
      CompanyGroupID: rolesData.CompanyGroupID,
      GroupID: rolesData.GroupID,
      MenuRights: menus.filter((m) => m.active).map((m) => ({
        MenuID: m.MenuID,
        ParentMenuID: m.ParentID,
        ModuleID: m.ModuleID,
        DepartmentID: 0,
        GroupFlag: m.GroupFlag, // ← use actual GroupFlag, not hardcoded 'N'
        LevelNo: m.LevelNo,
        AmountLimit: m.amountLimit,
        APPRVAPP: m.apprvapp,
        Buttons: Object.entries(m.buttons).map(([ButtonName, active]) => ({
          ButtonName,
          IsButtonActive: String(active),
        })),
      })),
    };
    await saveGroupRoles(payload);
    toast('Group roles saved successfully!', 'success');
    setSelectedGroup(0);
    setMenus([]);
    setStep(1);
    setRolesData(null);
    setGlobalButtons({ Approve: false, Close: false, Search: false, Submit: false });
  } catch {
    toast('Failed to save group roles.', 'error');
  } finally {
    setSaving(false);
  }
};
//   const handleFinalSubmit = async () => {
//   if (!rolesData) return;
//   setSaving(true);
//   try {
//     const payload = {
//       CompanyID: rolesData.CompanyID,
//       CompanyGroupID: rolesData.CompanyGroupID,
//       GroupID: rolesData.GroupID,
//       MenuRights: menus.filter((m) => m.active).map((m) => ({
//         MenuID: m.MenuID,
//         ParentMenuID: m.ParentID,
//         ModuleID: m.ModuleID,
//         DepartmentID: 0,
//         GroupFlag: 'N',
//         LevelNo: m.LevelNo,
//         AmountLimit: m.amountLimit,
//         APPRVAPP: m.apprvapp,
//         Buttons: Object.entries(m.buttons).map(([ButtonName, active]) => ({
//           ButtonName,
//           IsButtonActive: String(active),
//         })),
//       })),
//     };
//     await saveGroupRoles(payload);
//     toast('Group roles saved successfully!', 'success');

//     // ← Reset everything back to initial state
//     setSelectedGroup(0);
//     setMenus([]);
//     setStep(1);
//     setRolesData(null);
//     setGlobalButtons({ Approve: false, Close: false, Search: false, Submit: false });

//   } catch {
//     toast('Failed to save group roles.', 'error');
//   } finally {
//     setSaving(false);
//   }
// };

//   const handleFinalSubmit = async () => {
//   if (!rolesData) return;
//   setSaving(true);
//   try {
//     const payload = {
//       CompanyID: rolesData.CompanyID,
//       CompanyGroupID: rolesData.CompanyGroupID,
//       GroupID: rolesData.GroupID,  // ← no UserID, no ParentCompanyID
//       MenuRights: menus.filter((m) => m.active).map((m) => ({
//         MenuID: m.MenuID,
//         ParentMenuID: m.ParentID,
//         ModuleID: m.ModuleID,
//         DepartmentID: 0,
//         GroupFlag: 'N',
//         LevelNo: m.LevelNo,
//         AmountLimit: m.amountLimit,
//         APPRVAPP: m.apprvapp,
//         Buttons: Object.entries(m.buttons).map(([ButtonName, active]) => ({
//           ButtonName,
//           IsButtonActive: String(active),
//         })),
//       })),
//     };
//     await saveGroupRoles(payload); // ← new save function
//     toast('Group roles saved successfully!', 'success');
//   } catch {
//     toast('Failed to save group roles.', 'error');
//   } finally {
//     setSaving(false);
//   }
// };

//   const handleFinalSubmit = async () => {
//   if (!rolesData) return;
//   setSaving(true);
//   try {
//     const payload = {
//       CompanyID: rolesData.CompanyID,
//       CompanyGroupID: rolesData.CompanyGroupID,
//       ParentCompanyID: rolesData.CompanyGroupID,      // ← use CompanyGroupID as ParentCompanyID
//       ParentCompanyGroupID: rolesData.CompanyGroupID, // ← use CompanyGroupID
//       GroupID: rolesData.GroupID,
//       UserID: 0,
//       ADV: 'N',
//       MenuRights: menus.filter((m) => m.active).map((m) => ({
//         MenuID: m.MenuID,
//         ParentMenuID: m.ParentID,
//         ModuleID: m.ModuleID,
//         DepartmentID: 0,
//         GroupFlag: 'N',
//         LevelNo: m.LevelNo,
//         AmountLimit: m.amountLimit,
//         APPRVAPP: m.apprvapp,
//         Buttons: Object.entries(m.buttons).map(([ButtonName, active]) => ({
//           ButtonName,
//           IsButtonActive: String(active),
//         })),
//       })),
//     };
//     // console.log('Final payload:', JSON.stringify(payload, null, 2));
//     await saveRoles(payload);
//     toast('Roles saved successfully!', 'success');
//   } catch {
//     toast('Failed to save roles.', 'error');
//   } finally {
//     setSaving(false);
//   }
// };

  const activeCount = menus.filter((m) => m.active).length;

  return (
    <div className="space-y-5">
      {/* Group selector only */}
      <div className="flex items-end gap-4">
        <div className="w-72">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Group</label>
          <select
            className="form-select"
            value={selectedGroup}
            onChange={(e) => {
              const gId = Number(e.target.value);
              setSelectedGroup(gId);
              setStep(1);
              setMenus([]);
              if (gId) loadRoles(gId);
            }}
          >
            <option value={0}>-- Select Group --</option>
            {groups.map((g) => (
              <option key={g.GroupID} value={g.GroupID}>{g.GroupName}</option>
            ))}
          </select>
        </div>
        {activeCount > 0 && !loading && (
          <span className="badge badge-green text-[11px] pb-1">{activeCount} active menus</span>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading menus…
        </div>
      ) : selectedGroup !== 0 && menus.length > 0 ? (
        <>
          <StepIndicator current={step} />
          {step === 1 && <Step1 menus={menus} onChange={handleMenuChange} />}
          {step === 2 && <Step2 globalButtons={globalButtons} onChange={setGlobalButtons} />}
          {step === 3 && <Step3 menus={menus} onChange={handleMenuChange} />}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button  onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
              <ChevronLeft size={14} /> Back
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => loadRoles(selectedGroup)}>
                <X size={13} /> Reset
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext} disabled={step === 1 && activeCount === 0}>
                  Next <ChevronRight size={14} />
                </Button>
              ) : (
                <Button variant="success" onClick={handleFinalSubmit} disabled={saving}>
                  <Save size={13} /> {saving ? 'Saving…' : 'Final Submit'}
                </Button>
              )}
            </div>
          </div>
        </>
      ) : selectedGroup !== 0 ? (
        <div className="rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          No menus available for this group
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          Select a group to begin role allocation
        </div>
      )}
    </div>
  );
}

// ── User Tab ───────────────────────────────────────────────
function UserTab() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [selectedUser, setSelectedUser] = useState(0);
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rolesData, setRolesData] = useState<RolesResponse | null>(null);
  const [popupMenu, setPopupMenu] = useState<MenuRow | null>(null);

  const user = useAppSelector((s) => s.auth.user);
const dept = (user as any)?.UserDepartment?.[0];

  console.log('UserTab - user:', dept);
const loggedInCompanyId = dept?.CompanyID ?? 0;
const loggedInCompanyGroupId = dept?.CompanyGroupID ?? 0;

 


  // Load all groups on mount
  useEffect(() => {
    getAllGroups(1, 100)
      .then((r) => setGroups(r?.data?.Group ?? []))
      .catch(() => setGroups([]));
  }, []);

  // Load users when group changes
  // Load users when group changes
useEffect(() => {
  if (!selectedGroup) { setUsers([]); return; }
  const grp = groups.find((g) => g.GroupID === selectedGroup);
  const companyGroupId = grp?.CompanyID ?? 0; // ← fixed: use CompanyID, not GroupCompanyID

  getGroupUsers(companyGroupId, selectedGroup)
    .then((r) => {
      const usersList = r?.data?.Users ?? [];
      setUsers(usersList);
    })
    .catch(() => setUsers([]));
}, [selectedGroup, groups]);

  const loadRoles = async (groupId: number, userId: number) => {
  setLoading(true);
  try {
    const res = await getRoles(loggedInCompanyId, groupId, userId);
    const data: RolesResponse = res?.data;
    setRolesData(data);
    setMenus(transformMenus(data?.Menu ?? [], true));
  } catch {
    setMenus([]);
  } finally {
    setLoading(false);
  }
};

  const handleChange = (id: number, field: keyof MenuRow, value: unknown) => {
    setMenus((prev) => prev.map((m) => m.MenuID === id ? { ...m, [field]: value } : m));
    };
    
const handleSubmit = async () => {
  if (!rolesData) return;
  setSaving(true);
  try {
    const payload = {
      CompanyID: loggedInCompanyId,
      CompanyGroupID: loggedInCompanyGroupId,
      ParentCompanyID: loggedInCompanyId,
      ParentCompanyGroupID: loggedInCompanyGroupId,
      GroupID: rolesData.GroupID,
      UserID: selectedUser,
      ADV: 'N',
      MenuRights: menus.filter((m) => m.active).map((m) => ({
        MenuID: m.MenuID,
        ParentMenuID: m.ParentID,
        ModuleID: m.ModuleID,
        DepartmentID: rolesData.DepartmentID ?? 0,
        GroupFlag: m.GroupFlag,
        LevelNo: m.LevelNo,
        AmountLimit: m.amountLimit,
        APPRVAPP: m.apprvapp,
        Buttons: Object.entries(m.buttons).map(([ButtonName, active]) => ({
          ButtonName,
          IsButtonActive: String(active),
        })),
      })),
    };
    await saveRoles(payload);
    toast('User roles saved successfully!', 'success');
    setSelectedGroup(0);
    setSelectedUser(0);
    setUsers([]);
    setMenus([]);
    setRolesData(null);
  } catch {
    toast('Failed to save user roles.', 'error');
  } finally {
    setSaving(false);
  }
};

//   const handleSubmit = async () => {
//   if (!rolesData) return;
//     // console.log('Full rolesData:', JSON.stringify(rolesData, null, 2)); // ← add

//   setSaving(true);
//   try {
//     const payload = {
//       CompanyID: rolesData.CompanyID,
//       CompanyGroupID: rolesData.CompanyGroupID,
//       ParentCompanyID: rolesData.CompanyID,
//       ParentCompanyGroupID: rolesData.CompanyGroupID,
//       GroupID: rolesData.GroupID,
//       UserID: selectedUser,
//       ADV: 'N',
//       MenuRights: menus.filter((m) => m.active).map((m) => ({
//         MenuID: m.MenuID,
//         ParentMenuID: m.ParentID,
//         ModuleID: m.ModuleID,
//         DepartmentID: 0,
//         GroupFlag: 'N',
//         LevelNo: m.LevelNo,
//         AmountLimit: m.amountLimit,
//         APPRVAPP: m.apprvapp,
//         Buttons: Object.entries(m.buttons).map(([ButtonName, active]) => ({
//           ButtonName,
//           IsButtonActive: String(active),
//         })),
//       })),
//     };
//     await saveRoles(payload);
// toast('User roles saved successfully!', 'success');
// setSelectedGroup(0);  // ← reset group dropdown
// setSelectedUser(0);   // ← reset user dropdown
// setUsers([]);         // ← clear users list
// setMenus([]);         // ← clear menu table
// setRolesData(null);   // ← clear roles data
//   } catch {
//     toast('Failed to save user roles.', 'error');
//   } finally {
//     setSaving(false);
//   }
// };

//   const handleSubmit = async () => {
//     if (!rolesData) return;
//     setSaving(true);
//     try {
//       const payload = {
//         CompanyID: rolesData.CompanyID,
//         CompanyGroupID: rolesData.CompanyGroupID,
//         ParentCompanyID: rolesData.CompanyGroupID,
//         ParentCompanyGroupID: rolesData.CompanyGroupID,
//         GroupID: rolesData.GroupID,
//         UserID: selectedUser,
//         ADV: 'N',
//         MenuRights: menus.filter((m) => m.active).map((m) => ({
//           MenuID: m.MenuID,
//           ParentMenuID: m.ParentID,
//           ModuleID: m.ModuleID,
//           DepartmentID: 0,
//           GroupFlag: 'N',
//           LevelNo: m.LevelNo,
//           AmountLimit: m.amountLimit,
//           APPRVAPP: m.apprvapp,
//           Buttons: Object.entries(m.buttons).map(([ButtonName, active]) => ({
//             ButtonName,
//             IsButtonActive: String(active),
//           })),
//         })),
//         };
//             // console.log('User payload:', JSON.stringify(payload, null, 2)); // ← add

//       await saveRoles(payload);
//       toast('User roles saved successfully!', 'success');
//     } catch {
//       toast('Failed to save user roles.', 'error');
//     } finally {
//       setSaving(false);
//     }
//   };

  return (
    <div className="space-y-5">
      {popupMenu && (
        <ButtonPermissionModal
          menu={popupMenu.MenuName}
          buttons={popupMenu.buttons}
          onClose={() => setPopupMenu(null)}
          onSave={(buttons) => { handleChange(popupMenu.MenuID, 'buttons', buttons); setPopupMenu(null); }}
        />
      )}

      {/* Group + User selectors only */}
      <div className="flex items-end gap-4">
        <div className="w-64">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Group</label>
          <select
            className="form-select"
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(Number(e.target.value));
              setSelectedUser(0);
              setMenus([]);
            }}
          >
            <option value={0}>-- Select Group --</option>
            {groups.map((g) => (
              <option key={g.GroupID} value={g.GroupID}>{g.GroupName}</option>
            ))}
          </select>
        </div>

        <div className="w-64">
          <label className="text-xs font-medium text-slate-600 mb-1 block">User</label>
          <select
            className="form-select"
            value={selectedUser}
            disabled={!selectedGroup}
            onChange={(e) => {
              const uId = Number(e.target.value);
              setSelectedUser(uId);
              if (uId) loadRoles(selectedGroup, uId);
              else setMenus([]);
            }}
          >
            <option value={0}>-- Select User --</option>
            {users.map((u) => (
              <option key={u.UserID} value={u.UserID}>{u.UserName} ({u.UserLoginID})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading menus…
        </div>
      ) : selectedUser !== 0 && menus.length > 0 ? (
        <>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Parent Menu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Menu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Active</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Assigned Buttons</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/5">Edit</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((row) => (
                  <tr key={row.MenuID} className={cn(
                    'border-b border-slate-100 last:border-0 transition-colors',
                    row.active ? 'bg-blue-50/30' : 'hover:bg-slate-50',
                  )}>
                    <td className="px-4 py-3 text-xs text-slate-400 font-medium">{row.ParentMenuName}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{row.MenuName}</td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        value={row.active}
                        onChange={(v) => {
                          handleChange(row.MenuID, 'active', v);
                          if (!v) handleChange(row.MenuID, 'buttons',
                            Object.fromEntries(Object.keys(row.buttons).map((b) => [b, false]))
                          );
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Object.entries(row.buttons).filter(([, v]) => v).map(([b]) => (
                          <span key={b} className="badge badge-blue text-[9px]">{b}</span>
                        ))}
                        {Object.values(row.buttons).every((v) => !v) && (
                          <span className="text-xs text-slate-300">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setPopupMenu(row)}
                        disabled={!row.active}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          row.active
                            ? 'text-blue-500 hover:bg-blue-50 hover:text-blue-700'
                            : 'text-slate-200 cursor-not-allowed',
                        )}
                      >
                        <Settings2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => loadRoles(selectedGroup, selectedUser)}>
              <X size={13} /> Reset
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              <Save size={13} /> {saving ? 'Saving…' : 'Submit'}
            </Button>
          </div>
        </>
      ) : selectedUser !== 0 ? (
        <div className="rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          No menus available
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          Select a group and user to manage permissions
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function RoleAllocation() {
  const [activeTab, setActiveTab] = useState<'group' | 'user'>('group');

  return (
    <PageCard title="Group / User Role Allocation">
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('group')}
          className={cn(
            'flex items-center gap-2 px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === 'group' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Users size={15} /> Group
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={cn(
            'flex items-center gap-2 px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === 'user' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <UserCircle size={15} /> User
        </button>
      </div>
      {activeTab === 'group' ? <GroupTab /> : <UserTab />}
    </PageCard>
  );
}