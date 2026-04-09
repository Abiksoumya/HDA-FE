import { axiosClient } from '@/utils/apiClient';
import type { AdminGroup, AdminGroupFormValues } from '@/types';

type GroupListResponse = Promise<{ data: { data: AdminGroup[] } }>;

export const getUserGroup = (
  _group_company_ngrpid?: number,
  _group_company_nid?: number,
  _usergroup_name?: string,
  _usergroup_id?: number,
): GroupListResponse => {
  const params: Record<string, unknown> = {};
  if (_group_company_ngrpid != null) params.p_group_company_ngrpid = _group_company_ngrpid;
  if (_group_company_nid != null) params.p_group_company_nid = _group_company_nid;
  params.p_usergroup_name = _usergroup_name ?? '';
  if (_usergroup_id != null) params.p_usergroup_id = _usergroup_id;
  return axiosClient.get('/api/master/admin-group', { params });
};

export const submit = (data: AdminGroupFormValues) =>
  axiosClient.post('/api/master/admin-group/save', data).then((r) => r.data);
