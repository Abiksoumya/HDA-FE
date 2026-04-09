import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { getCompanyGroup, getCompanyLayers } from '@/apis/master/companyApi';
import FormField from '@/components/shared/FormField';
import { cn } from '@/utils/cn';
import type { Company, CompanyFormValues, CompanyLayer } from '@/types';

const schema = Yup.object({
  p_ADMIN_COMPANY_SNAME: Yup.string()
    .required('Name is required')
    .min(2, 'Must be at least 2 characters'),
  p_email_no: Yup.string().email('Invalid email address').notRequired(),
});

interface Props {
  company: Company | null;
  onSave: (data: CompanyFormValues) => void;
}

export default function CompanyForm({ company, onSave }: Props) {
  const [companyGroupDD, setCompanyGroupDD] = useState<Company[]>([]);
  const [companyLayerDD, setCompanyLayerDD] = useState<CompanyLayer[]>([]);
  const [ddLoaded, setDdLoaded] = useState(false);
  const [selectedLayerDesc, setSelectedLayerDesc] = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue, control } =
    useForm<CompanyFormValues>({
      resolver: yupResolver(schema) as never,
      defaultValues: {
        p_ADMIN_COMPANY_NID: 0, p_ADMIN_COMPANY_NGRPID: 0, p_ADIMN_CMPN_LAYER_NID: 0,
        p_ADMIN_COMPANY_SNAME: '', p_short_name: '', p_addr1: '', p_addr2: '', p_addr3: '',
        p_phone_no: '', p_email_no: '', p_gst_no: '', p_pan_no: '', p_tan_no: '', p_fax_no: '',
      },
    });

  const watchedGroupId = useWatch({ control, name: 'p_ADMIN_COMPANY_NGRPID' });
  const watchedLayerId = useWatch({ control, name: 'p_ADIMN_CMPN_LAYER_NID' });

  // Load dropdowns
  useEffect(() => {
    setDdLoaded(false);
    Promise.all([
      getCompanyGroup().then((r) => setCompanyGroupDD(r?.data?.data ?? [])),
      getCompanyLayers().then((r) => setCompanyLayerDD(r?.data?.data ?? [])),
    ])
      .catch(() => {})
      .finally(() => {
        setDdLoaded(true);
        if (company?.ADMIN_COMPANY_NID) {
          setValue('p_ADMIN_COMPANY_NGRPID', company.ADMIN_COMPANY_NGRPID ?? 0);
          setValue('p_ADIMN_CMPN_LAYER_NID', company.ADIMN_CMPN_LAYER_NID ?? 0);
        }
      });
  }, [company, setValue]);

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

  // Sync group layer description
  useEffect(() => {
    if (watchedGroupId && companyGroupDD.length > 0) {
      const found = companyGroupDD.find((g) => String(g.ADMIN_COMPANY_NID) === String(watchedGroupId));
      setSelectedLayerDesc(found?.ADIMN_CMPN_LAYER_SDESC ?? '');
    } else {
      setSelectedLayerDesc('');
    }
  }, [watchedGroupId, companyGroupDD]);

  const I = (name: keyof CompanyFormValues, extra?: string) =>
    cn('form-input', errors[name] && 'border-red-400 focus:ring-red-400/40', extra);

  const S = (name: keyof CompanyFormValues) =>
    cn('form-select', errors[name] && 'border-red-400', !ddLoaded && 'opacity-60');

  return (
    <form id="company-form" onSubmit={handleSubmit(onSave)} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Parent Group */}
        <div className="md:col-span-5">
          <FormField label="Parent Group/Company" loading={!ddLoaded}>
            <select className={S('p_ADMIN_COMPANY_NGRPID')} {...register('p_ADMIN_COMPANY_NGRPID')} disabled={!ddLoaded}>
              <option value={0}>-- Select --</option>
              {companyGroupDD.map((opt) => (
                <option key={opt.ADMIN_COMPANY_NID} value={opt.ADMIN_COMPANY_NID}>{opt.ADMIN_COMPANY_SNAME}</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="md:col-span-3">
          <FormField label="Group/Company Layer">
            <div className="form-input bg-slate-50 text-slate-500 text-xs">{selectedLayerDesc || '—'}</div>
          </FormField>
        </div>
      </div>

      <hr className="my-4 border-slate-100" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3">
          <FormField label="Company Layer" loading={!ddLoaded}>
            <select className={S('p_ADIMN_CMPN_LAYER_NID')} {...register('p_ADIMN_CMPN_LAYER_NID')} disabled={!ddLoaded}>
              <option value={0}>-- Select --</option>
              {companyLayerDD.map((l) => (
                <option key={l.ADIMN_CMPN_LAYER_NID} value={l.ADIMN_CMPN_LAYER_NID}>{l.ADIMN_CMPN_LAYER_SDESC}</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="md:col-span-5">
          <FormField label="Name of Group/Company/Branch/Unit" required error={errors.p_ADMIN_COMPANY_SNAME?.message}>
            <input type="text" className={I('p_ADMIN_COMPANY_SNAME')} {...register('p_ADMIN_COMPANY_SNAME')} />
          </FormField>
        </div>
      </div>

      <hr className="my-4 border-slate-100" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <FormField label="Short Name / Prefix" error={errors.p_short_name?.message}>
          <input type="text" className={I('p_short_name')} {...register('p_short_name')} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Address 1" error={errors.p_addr1?.message}>
            <input type="text" className={I('p_addr1')} {...register('p_addr1')} />
          </FormField>
        </div>
        <FormField label="Address 2">
          <input type="text" className={I('p_addr2')} {...register('p_addr2')} />
        </FormField>
        <FormField label="Phone" error={errors.p_phone_no?.message}>
          <input type="tel" className={I('p_phone_no')} {...register('p_phone_no')} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Email" error={errors.p_email_no?.message}>
            <input type="email" className={I('p_email_no')} {...register('p_email_no')} />
          </FormField>
        </div>
        <FormField label="GST" error={errors.p_gst_no?.message}>
          <input type="text" className={I('p_gst_no')} {...register('p_gst_no')} />
        </FormField>
        <FormField label="PAN" error={errors.p_pan_no?.message}>
          <input type="text" className={I('p_pan_no')} {...register('p_pan_no')} />
        </FormField>
        <FormField label="TAN" error={errors.p_tan_no?.message}>
          <input type="text" className={I('p_tan_no')} {...register('p_tan_no')} />
        </FormField>
      </div>
    </form>
  );
}
