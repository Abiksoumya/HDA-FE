// import { useEffect, useState } from 'react';
// import { getSubLedgerTypes, getSubLedgerById } from '@/apis/finance/financeApi';
// import { useAppSelector } from '@/hooks/redux';
// import PageCard from '@/components/shared/PageCard';
// import SubLedgerForm from './SubLedgerForm';
// import SubLedgerSearch from './SubLedgerSearch';
// import type { SubLedgerFormData } from '@/types';

// interface SubLedgerType { SubLedgerTypeID: number; SubLedgerType: string; }
// interface SubLedgerRow { SubLedgerID: number; }

// export default function SubLedgerManager() {
//   const user = useAppSelector((s) => s.auth.user);
//   const dept = (user as any)?.UserDepartment?.[0];
//   const companyId = dept?.CompanyID ?? 0;
//   const companyGroupId = dept?.CompanyGroupID ?? 0;

//   const [types, setTypes] = useState<SubLedgerType[]>([]);
//   const [selectedTypeId, setSelectedTypeId] = useState(0);
//   const [editData, setEditData] = useState<SubLedgerFormData | null>(null);
//   const [refreshKey, setRefreshKey] = useState(0);
//   const [loadingEdit, setLoadingEdit] = useState(false);

//   useEffect(() => {
//     getSubLedgerTypes()
//       .then((r) => setTypes(r?.data?.SubLedgerTypeList ?? []))
//       .catch(() => setTypes([]));
//   }, []);

//   // Selecting a type always opens a fresh Add New form
//   const handleTypeChange = (typeId: number) => {
//     setSelectedTypeId(typeId);
//     setEditData(null); // ← always fresh form, not edit
//   };

//   const handleEdit = async (row: SubLedgerRow) => {
//   setLoadingEdit(true);
//   try {
//     const res = await getSubLedgerById(companyId, companyGroupId, row.SubLedgerID);
//     const raw = res?.data?.Data; // ← unwrap Data

//     if (raw) {
//       const mapped: SubLedgerFormData = {
//         SubLedgerID: raw.Header?.SubLedgerID ?? 0,
//         CompanyID: raw.Header?.CompanyID ?? 0,
//         CompanyGroupID: raw.Header?.CompanyGroupID ?? 0,
//         SubLedgerTypeID: raw.Header?.SubLedgerTypeID ?? 0,
//         SubLedgerCode: raw.Header?.SubLedgerCode ?? '',
//         LegalName: raw.Header?.LegalName ?? '',
//         EntityLookup: raw.Header?.EntityLookup ?? '',
//         TDSNatureLookup: raw.Header?.TDSNatureLookup ?? '',
//         EstablishmentLookup: raw.Header?.EstablishmentLookup ?? '',
//         DateOfIncorporation: raw.Header?.DateOfIncorporation ?? '',
//         StateLookup: raw.Header?.StateLookup ?? '',
//         CINNumber: raw.Header?.CINNumber ?? '',
//         RegOfficeAddress: raw.Header?.RegOfficeAddress ?? '',
//         BizOfficeAddress: raw.Header?.BizOfficeAddress ?? '',
//         Remarks: raw.Header?.Remarks ?? '',
//         Contacts: raw.Contacts ?? [],
//         Banks: raw.Banks ?? [],
//         Clients: raw.Clients ?? [],
//         Documents: raw.Documents ?? [],
//         Business: raw.Business ?? {
//           SubLedgerBusinessID: 0,
//           RecordState: 1,
//           AccountID: 0,
//           NoOfEmployee: 0,
//           AnnualTurnover: 0,
//           AuditorName: '',
//           BusinessTypeLookup: '',
//           NatureOfBizLookup: '',
//           LicenseNumber: '',
//         },
//       };
//       setEditData(mapped);
//     } else {
//       setEditData(null);
//     }
//   } catch {
//     setEditData(null);
//   } finally {
//     setLoadingEdit(false);
//   }
// };

//   const handleSaved = () => {
//     setEditData(null);
//     setRefreshKey((k) => k + 1);
//     // Re-trigger fresh form for same type after save
//     setEditData(null);
//   };

//   const handleCancelForm = () => {
//     setEditData(null);
//   };

//   return (
//     <PageCard title="Sub Ledger">
//       {/* Type selector */}
//       <div className="w-72 mb-6">
//         <label className="text-xs font-medium text-slate-600 mb-1 block">Sub Ledger Type</label>
//         <select
//           className="form-select"
//           value={selectedTypeId}
//           onChange={(e) => handleTypeChange(Number(e.target.value))}
//         >
//           <option value={0}>-- Select --</option>
//           {types.map((t) => (
//             <option key={t.SubLedgerTypeID} value={t.SubLedgerTypeID}>{t.SubLedgerType}</option>
//           ))}
//         </select>
//       </div>

//       {selectedTypeId === 0 ? (
//         <div className="rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
//           Select a Sub Ledger Type to continue
//         </div>
//       ) : (
//         <>
//           {/* Form — always visible on top when a type is selected */}
//           <div className="rounded-xl border border-slate-200 p-5 mb-6">
//             <h3 className="text-sm font-semibold text-slate-800 mb-4">
//               {editData ? 'Edit Sub Ledger' : 'Add New Sub Ledger'}
//             </h3>
//             {loadingEdit ? (
//               <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
//                 Loading record…
//               </div>
//             ) : (
//               <SubLedgerForm
//                 editData={editData}
//                 companyId={companyId}
//                 companyGroupId={companyGroupId}
//                 defaultTypeId={selectedTypeId}
//                 onSaved={handleSaved}
//                 onCancel={handleCancelForm}
//               />
//             )}
//           </div>

//           {/* List — always visible below */}
//           <SubLedgerSearch
//             companyId={companyId}
//             companyGroupId={companyGroupId}
//             subLedgerTypeId={selectedTypeId}
//             refreshKey={refreshKey}
//             onEdit={handleEdit}
//           />
//         </>
//       )}
//     </PageCard>
//   );
// }

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { useToast } from '@/hooks/useToast';
import PageCard from '@/components/shared/PageCard';
import SubLedgerForm from './SubLedgerForm';
import SubLedgerEmployeeForm from './SubLedgerEmployeeForm';
import SubLedgerSearch from './SubLedgerSearch';
import {
  getSubLedgerTypes,
  getSubLedgerById,
  getSubLedgerEmployeeById,
  createSubLedgerEmployee,
} from '@/apis/finance/financeApi';
import type { SubLedgerFormData } from '@/types';

interface SubLedgerType { SubLedgerTypeID: number; SubLedgerType: string; }
interface SubLedgerRow { SubLedgerID: number; }

const EMPLOYEE_TYPE_ID = 3;

export default function SubLedgerManager() {
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const dept = (user as any)?.UserDepartment?.[0];
  const companyId = dept?.CompanyID ?? 0;
  const companyGroupId = dept?.CompanyGroupID ?? 0;

  const [types, setTypes] = useState<SubLedgerType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState(0);
  const [editData, setEditData] = useState<unknown>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const isEmployeeType = selectedTypeId === EMPLOYEE_TYPE_ID;

  // Load sub ledger types on mount
  useEffect(() => {
    getSubLedgerTypes()
      .then((r) => setTypes(r?.data?.SubLedgerTypeList ?? []))
      .catch(() => setTypes([]));
  }, []);

  // Selecting a type always opens fresh Add New form
  const handleTypeChange = (typeId: number) => {
    setSelectedTypeId(typeId);
    setEditData(null);
  };

  const handleEdit = async (row: SubLedgerRow) => {
    setLoadingEdit(true);
    try {
      if (isEmployeeType) {
        // Employee SP
        const res = await getSubLedgerEmployeeById(companyId, companyGroupId, row.SubLedgerID);
        const raw = res?.data?.Data;
        if (raw) {
          setEditData({
            SubLedgerID: raw.Employee?.SubLedgerID ?? 0,
            SubLedgerCode: raw.Employee?.SubLedgerCode ?? '',
            Employee: {
              ProfileName: raw.Employee?.ProfileName ?? '',
              Address: raw.Employee?.Address ?? '',
              Address2: raw.Employee?.Address2 ?? '',
              StateLookup: raw.Employee?.StateLookup ?? '',
              City: raw.Employee?.City ?? '',
              Pin: raw.Employee?.Pin ?? '',
              ContactNo: raw.Employee?.ContactNo ?? '',
              EMail: raw.Employee?.EMail ?? '',
              PAN: raw.Employee?.PAN ?? '',
              Aadhaar: raw.Employee?.Aadhaar ?? '',
            },
            Banks: (raw.Banks ?? []).map((b: any) => ({
              EmployeeBankID: b.SubLedgerEmployeeBankID ?? b.EmployeeBankID ?? 0,
              RecordState: 2,
              BankID: b.BankID,
              BranchID: b.BranchID,
              BankAccountNo: b.BankAccountNo,
              BankAccountName: b.BankAccountName,
              IsActive: b.IsActive,
              BankName: b.BankName,
              BranchName: b.BranchName,
            })),
          });
        }
      } else {
        // Generic SP
        const res = await getSubLedgerById(companyId, companyGroupId, row.SubLedgerID);
        const raw = res?.data?.Data;
        if (raw) {
          const mapped: SubLedgerFormData = {
            SubLedgerID: raw.Header?.SubLedgerID ?? 0,
            CompanyID: raw.Header?.CompanyID ?? 0,
            CompanyGroupID: raw.Header?.CompanyGroupID ?? 0,
            SubLedgerTypeID: raw.Header?.SubLedgerTypeID ?? 0,
            SubLedgerCode: raw.Header?.SubLedgerCode ?? '',
            LegalName: raw.Header?.LegalName ?? '',
            EntityLookup: raw.Header?.EntityLookup ?? '',
            TDSNatureLookup: raw.Header?.TDSNatureLookup ?? '',
            EstablishmentLookup: raw.Header?.EstablishmentLookup ?? '',
            DateOfIncorporation: raw.Header?.DateOfIncorporation ?? '',
            StateLookup: raw.Header?.StateLookup ?? '',
            CINNumber: raw.Header?.CINNumber ?? '',
            RegOfficeAddress: raw.Header?.RegOfficeAddress ?? '',
            BizOfficeAddress: raw.Header?.BizOfficeAddress ?? '',
            Remarks: raw.Header?.Remarks ?? '',
            Contacts: raw.Contacts ?? [],
            Banks: raw.Banks ?? [],
            Clients: raw.Clients ?? [],
            Documents: raw.Documents ?? [],
            Business: raw.Business ?? {
              SubLedgerBusinessID: 0,
              RecordState: 1,
              AccountID: 0,
              NoOfEmployee: 0,
              AnnualTurnover: 0,
              AuditorName: '',
              BusinessTypeLookup: '',
              NatureOfBizLookup: '',
              LicenseNumber: '',
            },
          };
          setEditData(mapped);
        }
      }
    } catch {
      setEditData(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSaved = () => {
    setEditData(null);
    setRefreshKey((k) => k + 1);
  };

  const handleCancelForm = () => {
    setEditData(null);
  };

  const handleEmployeeSave = async (payload: unknown) => {
    try {
      await createSubLedgerEmployee(payload);
      toast('Employee sub ledger saved successfully!', 'success');
      handleSaved();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save employee sub ledger.', 'error');
    }
  };

  return (
    <PageCard title="Sub Ledger">
      {/* Type selector */}
      <div className="w-72 mb-6">
        <label className="text-xs font-medium text-slate-600 mb-1 block">Sub Ledger Type</label>
        <select
          className="form-select"
          value={selectedTypeId}
          onChange={(e) => handleTypeChange(Number(e.target.value))}
        >
          <option value={0}>-- Select --</option>
          {types.map((t) => (
            <option key={t.SubLedgerTypeID} value={t.SubLedgerTypeID}>
              {t.SubLedgerType}
            </option>
          ))}
        </select>
      </div>

      {selectedTypeId === 0 ? (
        <div className="rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          Select a Sub Ledger Type to continue
        </div>
      ) : (
        <>
          {/* Form — always visible on top when type is selected */}
          <div className="rounded-xl border border-slate-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              {editData ? 'Edit Sub Ledger' : 'Add New Sub Ledger'}
            </h3>

            {loadingEdit ? (
              <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                Loading record…
              </div>
            ) : isEmployeeType ? (
              <SubLedgerEmployeeForm
                key={`emp-${selectedTypeId}-${JSON.stringify(editData)}`}
                editData={editData as any}
                companyId={companyId}
                companyGroupId={companyGroupId}
                subLedgerTypeId={selectedTypeId}
                createFn={handleEmployeeSave}
                onSaved={handleSaved}
                onCancel={handleCancelForm}
              />
            ) : (
              <SubLedgerForm
                key={`gen-${selectedTypeId}-${JSON.stringify(editData)}`}
                editData={editData as SubLedgerFormData}
                companyId={companyId}
                companyGroupId={companyGroupId}
                defaultTypeId={selectedTypeId}
                onSaved={handleSaved}
                onCancel={handleCancelForm}
              />
            )}
          </div>

          {/* List — always visible below */}
          <SubLedgerSearch
            companyId={companyId}
            companyGroupId={companyGroupId}
            subLedgerTypeId={selectedTypeId}
            isEmployeeType={isEmployeeType}
            refreshKey={refreshKey}
            onEdit={handleEdit}
          />
        </>
      )}
    </PageCard>
  );
}