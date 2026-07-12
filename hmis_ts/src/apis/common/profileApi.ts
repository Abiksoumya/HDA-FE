import { axiosClient } from '@/utils/apiClient';

export const getFinancialYears = () =>
  axiosClient.get('/api/profile/financial-years').then((r) => r.data);

export const getProfileSwitchDepartments = (userId: number) =>
  axiosClient
    .get('/api/profile/switch-departments', { params: { UserID: userId } })
    .then((r) => r.data);

export const changePassword = (data: {
  UserID: number;
  OldPassword: string;
  NewPassword: string;
  ConfirmPassword: string;
}) => axiosClient.post('/api/profile/change-password', data).then((r) => r.data);

export const updateProfileSwitch = (data: {
  UserID: number;
  CompanyID: number;
  CompanyGroupID: number;
  FinancialYearID: number;
  DepartmentID: number;
  SwitchToFinancialYearID: number;
  SwitchToBranchID: number;
  SwitchToDepartmentID: number;
}) => axiosClient.post('/api/profile/switch', data).then((r) => r.data);