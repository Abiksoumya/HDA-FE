import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { getCompanyGroup, getCompanyLayers,getAllCompanies, getCompaniesForDropdown } from '@/apis/master/companyApi';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { Company, CompanyFormValues, CompanyLayer, CompanyPayload,  } from '@/types';

const schema = Yup.object({
  p_ADMIN_COMPANY_SNAME: Yup.string()
    .required('Name is required')
    .min(2, 'Must be at least 2 characters'),
  p_short_name: Yup.string()
    .required('Code is required')
    .max(3, 'Max 3 characters'),
  p_addr1: Yup.string()
    .required('Address is required'),
  p_email_no: Yup.string()
    .email('Invalid email address')
    .notRequired(),
});

interface ParentOption {
  id: number;
  name: string;
}

interface Props {
  company: Company | null;
  onSave: (data: CompanyPayload) => void;
}

export default function CompanyForm({ company, onSave }: Props) {
  const [companyLayerDD, setCompanyLayerDD] = useState<CompanyLayer[]>([]);
  const [parentDD, setParentDD] = useState<ParentOption[]>([]);
  const [parentLabel, setParentLabel] = useState('Parent Group/Company');
  const [ddLoaded, setDdLoaded] = useState(false);
  const [parentLoading, setParentLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, control,watch  } =
    useForm<CompanyFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        p_ADMIN_COMPANY_NID: 0, p_ADMIN_COMPANY_NGRPID: 0, p_ADIMN_CMPN_LAYER_NID: 0,
        p_ADMIN_COMPANY_SNAME: '', p_short_name: '', p_addr1: '', p_addr2: '', p_addr3: '',
        p_phone_no: '', p_email_no: '', p_gst_no: '', p_pan_no: '', p_tan_no: '', p_fax_no: '',
        p_inactive: false,
      },
    });

  const watchedLayerId = useWatch({ control, name: 'p_ADIMN_CMPN_LAYER_NID' });

  // Load company layers on mount
  useEffect(() => {
    getCompanyLayers()
      .then((r) => setCompanyLayerDD(r?.data?.data ?? []))
      .catch(() => setCompanyLayerDD([]))
      .finally(() => setDdLoaded(true));
  }, []);

  // When layer changes → load correct parent options
  useEffect(() => {
    const layerId = Number(watchedLayerId);

    // Reset parent selection
    setValue('p_ADMIN_COMPANY_NGRPID', 0);
    setParentDD([]);

    if (!layerId || layerId === 0) return;

    if (layerId === 1) {
      // Group Company — no parent needed
      setParentLabel('Parent Group/Company');
      setParentDD([]);
      return;
    }

    if (layerId === 2) {
  setParentLabel('Select Group Company');
  setParentLoading(true);
  getCompanyGroup()
    .then((r) => {
      const data = r?.data?.data ?? [];
      setParentDD(
        data.map((d: { CompanyID: number; Description: string }) => ({
          id: d.CompanyID,      // ← CompanyID not ADMIN_COMPANY_NID
          name: d.Description,  // ← Description not ADMIN_COMPANY_SNAME
        })),
      );
    })
    .catch(() => setParentDD([]))
    .finally(() => setParentLoading(false));
  return;
}

    // Branch → Companies (LayerID = 2)
if (layerId === 3) {
  setParentLabel('Select Company');
  setParentLoading(true);
  getCompaniesForDropdown(2)
    .then((r) => {
      const data = r?.data ?? [];
      setParentDD(data.map((c: { CompanyID: number; Description: string }) => ({
        id: c.CompanyID,
        name: c.Description,
      })));
    })
    .catch(() => setParentDD([]))
    .finally(() => setParentLoading(false));
  return;
}

// Unit → Branches (LayerID = 3)
if (layerId === 4) {
  setParentLabel('Select Branch');
  setParentLoading(true);
  getCompaniesForDropdown(3)
    .then((r) => {
      const data = r?.data ?? [];
      setParentDD(data.map((c: { CompanyID: number; Description: string }) => ({
        id: c.CompanyID,
        name: c.Description,
      })));
    })
    .catch(() => setParentDD([]))
    .finally(() => setParentLoading(false));
  return;
}
  }, [watchedLayerId, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (company?.ADMIN_COMPANY_NID) {
      reset({
        p_ADMIN_COMPANY_NID: company.ADMIN_COMPANY_NID,
        p_ADMIN_COMPANY_NGRPID: company.ADMIN_COMPANY_NGRPID ?? 0,
        p_ADIMN_CMPN_LAYER_NID: company.ADIMN_CMPN_LAYER_NID ?? 0,
        p_ADMIN_COMPANY_SNAME: company.ADMIN_COMPANY_SNAME ?? '',
        p_short_name: company.ADMIN_COMPANY_SHORTNAME ?? '',
        p_addr1: company.ADMIN_COMPANY_PROFILE_SADDR ?? '',
        p_addr2: company.ADMIN_COMPANY_PROFILE_SADDR1 ?? '',
        p_addr3: '', p_phone_no: company.ADMIN_COMPANY_PROFILE_SPHONE ?? '',
        p_email_no: company.ADMIN_COMPANY_PROFILE_SEMAIL ?? '',
        p_gst_no: company.ADMIN_COMPANY_PROFILE_SGST ?? '',
        p_pan_no: company.ADMIN_COMPANY_PROFILE_SPAN ?? '',
        p_tan_no: company.ADMIN_COMPANY_PROFILE_STAN ?? '', p_fax_no: '',
      });
    } else {
      reset({
        p_ADMIN_COMPANY_NID: 0, p_ADMIN_COMPANY_NGRPID: 0, p_ADIMN_CMPN_LAYER_NID: 0,
        p_ADMIN_COMPANY_SNAME: '', p_short_name: '', p_addr1: '', p_addr2: '', p_addr3: '',
        p_phone_no: '', p_email_no: '', p_gst_no: '', p_pan_no: '', p_tan_no: '', p_fax_no: '',
      });
    }
  }, [company, reset]);

  const showParent = Number(watchedLayerId) > 1; // hide for Group Company
  const I = (name: keyof CompanyFormValues, extra?: string) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40', extra);

  const onSubmit = (data: CompanyFormValues) => {
  console.log('Form data:', data); // ← check p_ADMIN_COMPANY_NGRPID value

  const payload = {
    CompanyID: data.p_ADMIN_COMPANY_NID ?? 0,
    Code: data.p_short_name,
    Description: data.p_ADMIN_COMPANY_SNAME,
    LayerID: Number(data.p_ADIMN_CMPN_LAYER_NID),
    LevelNo: 0,
    ParentCompanyID: Number(data.p_ADMIN_COMPANY_NGRPID) ?? 0,
    MasterLevel: 1,
    RecordState: data.p_ADMIN_COMPANY_NID ? 2 : 1,
    // Flat — no nested Profile
    Address: data.p_addr1 ?? '',
    Address2: data.p_addr2 ?? '',
    Address3: data.p_addr3 ?? '',
    Phone: data.p_phone_no ?? '',
    Fax: data.p_fax_no ?? '',
    EMail: data.p_email_no ?? '',
    PANNo: data.p_pan_no ?? '',
    TANNo: data.p_tan_no ?? '',
    GSTIN: data.p_gst_no ?? '',
    InActive: data.p_inactive ?? false,

  };
      console.log('Payload:', payload); // ← check final payload

  onSave(payload);
};



  return (
<form id="company-form" onSubmit={handleSubmit(onSubmit)} noValidate>
  {/* Row 1 — Company Layer + Parent Layer Label + Parent Dropdown */}
<div className="flex items-end justify-between gap-4 mb-4">
<div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
  <div className="md:col-span-3">
    <FormField label="Company Layer" loading={!ddLoaded}>
      <select
        className={cn('form-select', !ddLoaded && 'opacity-60')}
        disabled={!ddLoaded}
        {...register('p_ADIMN_CMPN_LAYER_NID', { valueAsNumber: true })}
      >
        <option value={0}>-- Select --</option>
        {companyLayerDD.map((l) => (
          <option key={l.ADIMN_CMPN_LAYER_NID} value={l.ADIMN_CMPN_LAYER_NID}>
            {l.ADIMN_CMPN_LAYER_SDESC}
          </option>
        ))}
      </select>
    </FormField>
        </div>
        

  {showParent && (
    <>

      {/* Parent dropdown */}
      <div className="md:col-span-4">
        <FormField label={parentLabel} loading={parentLoading}>
          <select
            className={cn('form-select', parentLoading && 'opacity-60')}
            disabled={parentLoading || parentDD.length === 0}
            {...register('p_ADMIN_COMPANY_NGRPID', { valueAsNumber: true })}
          >
            <option value={0}>-- Select --</option>
            {parentDD.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </FormField>
            </div>
            <div className="md:col-span-4 flex flex-col justify-end pb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
          Parent Type
        </span>
        <span className="text-sm font-medium text-gray-600">
          {Number(watchedLayerId) === 2 && 'Group Company'}
          {Number(watchedLayerId) === 3 && 'Company'}
          {Number(watchedLayerId) === 4 && 'Branch'}
        </span>
      </div>
    </>
  )}
</div>
      {/* InActive Toggle */}
<div className="flex items-center gap-3 mb-4">
  <span className="text-xs font-medium text-slate-600">Status</span>
  <button
    type="button"
    onClick={() => setValue('p_inactive', !watch('p_inactive'))}
    className={cn(
      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
      watch('p_inactive') ? 'bg-red-600' : 'bg-emerald-700',
    )}
  >
    <span
      className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
        watch('p_inactive') ? 'translate-x-1' : 'translate-x-4',
      )}
    />
  </button>
  {/* <span className={cn('text-xs font-medium', watch('p_inactive') ? 'text-red-500' : 'text-emerald-600')}>
    {watch('p_inactive') ? 'Inactive' : 'Active'}
  </span> */}
        </div>
        </div>

  {/* Row 2 — Name */}
  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
  <div className="md:col-span-6">
    <FormField label="Name of Group/Company/Branch/Unit" required error={errors.p_ADMIN_COMPANY_SNAME?.message}>
      <input
        type="text"
        className={I('p_ADMIN_COMPANY_SNAME')}
        {...register('p_ADMIN_COMPANY_SNAME')}
      />
    </FormField>
  </div>
  <div className="md:col-span-3">
    <FormField label="Short Name / Prefix" error={errors.p_short_name?.message}>
      <input type="text" className={I('p_short_name')} {...register('p_short_name')} />
    </FormField>
  </div>
</div>

<hr className="my-4 border-slate-100" />

{/* Row 3 — Address, Phone, Email, GST, PAN, TAN */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
  <div className="sm:col-span-2">
    <FormField label="Address 1">
      <input type="text" className={I('p_addr1')} {...register('p_addr1')} />
    </FormField>
  </div>
  <FormField label="Address 2">
    <input type="text" className={I('p_addr2')} {...register('p_addr2')} />
  </FormField>
  <FormField label="Phone">
    <input type="tel" className={I('p_phone_no')} {...register('p_phone_no')} />
  </FormField>
  <div className="sm:col-span-2">
    <FormField label="Email" error={errors.p_email_no?.message}>
      <input type="email" className={I('p_email_no')} {...register('p_email_no')} />
    </FormField>
  </div>
  <FormField label="GST">
    <input type="text" className={I('p_gst_no')} {...register('p_gst_no')} />
  </FormField>
  <FormField label="PAN">
    <input type="text" className={I('p_pan_no')} {...register('p_pan_no')} />
  </FormField>
  <FormField label="TAN">
    <input type="text" className={I('p_tan_no')} {...register('p_tan_no')} />
  </FormField>
</div>
</form>
  );
}