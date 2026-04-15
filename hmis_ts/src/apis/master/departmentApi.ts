import { axiosClient } from '@/utils/apiClient';
import type { DepartmentFormValues } from '@/types';

export const getAllDepartments = (page = 1, pageSize = 5) =>
  axiosClient
    .get('/api/department-master/all', { params: { page, pageSize, ShowActiveOnly: 1 } })
    .then((r) => r.data);

export const getDepartmentsForDropdown = () =>
  axiosClient
    .get('/api/department-master/dropdown', { params: { ShowActiveOnly: 1 } })
    .then((r) => r.data);

export const saveDepartment = (data: unknown) =>
  axiosClient.post('/api/department-master', data).then((r) => r.data);