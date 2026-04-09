import { axiosClient } from '@/utils/apiClient';
import type { Department, DepartmentFormValues } from '@/types';

type DeptListResponse = Promise<{ data: { data: Department[] } }>;

export const getDepartmentSearch = (
  s_ADMIN_DEPRT_NID?: number,
  s_ADMIN_DEPRT_SNAME?: string,
): DeptListResponse => {
  const params: Record<string, unknown> = {};
  if (s_ADMIN_DEPRT_NID != null) params.p_ADMIN_DEPRT_NID = s_ADMIN_DEPRT_NID;
  if (s_ADMIN_DEPRT_SNAME?.trim()) params.p_ADMIN_DEPRT_SNAME = s_ADMIN_DEPRT_SNAME.trim();
  return axiosClient.get('/api/master/get-department', { params });
};

export const saveDepartment = (data: DepartmentFormValues) =>
  axiosClient.post('/api/master/departments/save', data).then((r) => r.data);
