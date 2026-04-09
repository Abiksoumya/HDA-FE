import { axiosClient } from '@/utils/apiClient';
import type { Company, CompanyLayer, CompanyFormValues } from '@/types';

type CompanyListResponse = Promise<{ data: { data: Company[] } }>;
type LayerListResponse = Promise<{ data: { data: CompanyLayer[] } }>;

export const getCompanyLayers = (p_CMPN_LAYER_NID?: number): LayerListResponse => {
  const params = p_CMPN_LAYER_NID ? { p_CMPN_LAYER_NID } : {};
  return axiosClient.get('api/companies/company-layers', { params });
};

export const getCompanyGroup = (): CompanyListResponse =>
  axiosClient.get('/api/companies/get-group-company');

export const getCompanySearch = (
  s_ADMIN_COMPANY_NID?: number,
  s_ADMIN_COMPANY_SNAME?: string,
): CompanyListResponse => {
  const params: Record<string, unknown> = {};
  if (s_ADMIN_COMPANY_NID != null) params.p_ADMIN_COMPANY_NID = s_ADMIN_COMPANY_NID;
  if (s_ADMIN_COMPANY_SNAME?.trim()) params.p_ADMIN_COMPANY_SNAME = s_ADMIN_COMPANY_SNAME.trim();
  return axiosClient.get('/api/companies/get-company-setup', { params });
};

export const saveGroupCompany = (data: CompanyFormValues) =>
  axiosClient.post('/api/companies/save-details', data).then((r) => r.data);

export const getAllCompanies = (page = 1, pageSize = 5, search = '') =>
  axiosClient
    .get('/api/company-master/all', { params: { page, pageSize, ShowActiveOnly: 1 } })
    .then((r) => r.data);


// For dropdowns — no pagination, returns all
export const getCompaniesForDropdown = (layerId?: number) =>
  axiosClient
    .get('/api/company-master/dropdown', {
      params: { ShowActiveOnly: 1, ...(layerId && { LayerID: layerId }) },
    })
    .then((r) => r.data);
