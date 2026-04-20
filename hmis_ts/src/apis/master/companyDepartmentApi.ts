import { axiosClient } from '@/utils/apiClient';
import type { Company, DeptMappingItem, CompanyDeptFormValues } from '@/types';

type BranchListResponse = Promise<{ data: { data: Company[] } }>;
type DeptResponse = Promise<{ data: { data: DeptMappingItem[] } }>;

// export const getCompanyBranch = (): BranchListResponse =>
//   axiosClient.get('/api/master/branch-units');

export const getCompanyBranch = () =>
  axiosClient
    .get('/api/company-master/dropdown')
    .then((r) => r.data);

export const getCompanySearch = (
  s_ADMIN_COMPANY_NID?: number,
  s_ADMIN_COMPANY_SNAME?: string,
): BranchListResponse => {
  const params: Record<string, unknown> = {};
  if (s_ADMIN_COMPANY_NID != null) params.p_ADMIN_COMPANY_NID = s_ADMIN_COMPANY_NID;
  if (s_ADMIN_COMPANY_SNAME?.trim()) params.p_ADMIN_COMPANY_SNAME = s_ADMIN_COMPANY_SNAME.trim();
  return axiosClient.get('/api/companies/get-company-setup', { params });
};

export const getCompantDepartmentInfo = (s_ADMIN_COMPANY_NID: number): DeptResponse => {
  const params: Record<string, unknown> = {};
  if (s_ADMIN_COMPANY_NID != null) params.p_ADMIN_CMPNY_DEPRT_NCMPNYID = s_ADMIN_COMPANY_NID;
  return axiosClient.get('/api/companies/get-departments', { params });
};

export const saveGroupCompany = (data: CompanyDeptFormValues) =>
  axiosClient.post('/api/companies/save-department', data).then((r) => r.data);


export const getCompanyDepartmentMapping = (
  companyId: number,
  pageNo = 0,
  pageSize = 0,
) =>
  axiosClient
    .get('/api/company-department/mapping', {
      params: { CompanyID: companyId, PageNo: pageNo, PageSize: pageSize },
    })
    .then((r) => r.data);

export const saveCompanyDepartmentMapping = (data: unknown) =>
  axiosClient.post('/api/company-department/mapping', data).then((r) => r.data);