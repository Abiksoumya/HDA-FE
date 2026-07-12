import { axiosClient } from '@/utils/apiClient';

export const getAllUsers = (
  page = 1,
  pageSize = 5,
  companyId = 0,
  groupId = 0,
) =>
  axiosClient
    .get('/api/user-master/all', {
      params: {
        PageNo: page,
        PageSize: pageSize,
        CompanyID: companyId,
        GroupID: groupId,
        ShowActiveOnly: 0,
      },
    })
    .then((r) => r.data);

export const saveUser = (data: unknown) =>
  axiosClient.post('/api/user-master', data).then((r) => r.data);