import { axiosClient } from '@/utils/apiClient';

export const getAllGroups = (page = 1, pageSize = 5, companyId = 0, groupCompanyId = 0) =>
  axiosClient
    .get('/api/group-master/all', {
      params: { PageNo: page, PageSize: pageSize, CompanyID: companyId, GroupCompanyID: groupCompanyId, ShowActiveOnly: 0 },
    })
    .then((r) => r.data);

export const getGroupsForDropdown = (companyId = 0, groupCompanyId = 0) =>
  axiosClient
    .get('/api/group-master/dropdown', {
      params: { 
        CompanyID: companyId, 
        GroupCompanyID: groupCompanyId, 
        ShowActiveOnly: 1 
      },
    })
    .then((r) => {
      // console.log('Raw groups API:', r.data); // ← check structure
      return r.data;
    });

export const saveGroup = (data: unknown) =>
  axiosClient.post('/api/group-master', data).then((r) => r.data);