import { axiosClient } from '@/utils/apiClient';

export interface ApiButton {
  ButtonName: string;
  IsButtonMapped: boolean;
  IsButtonMappedDisplay: string;
}

export interface ApiMenu {
  RecordNo: number;
  MenuID: number;
  ParentID: number;
  MenuName: string;
  ModuleID: number;
  GroupFlag: string;
    IsMapped?: boolean;        // ← add
    IsEnable: boolean | number;


  LevelNo: number;
  AmountLimit: number;
  APPRVAPP: number;
  Buttons: { ButtonName: string; IsButtonMapped: boolean; IsButtonMappedDisplay: string }[];
  // New SP fields
  MenuButtons?: { ButtonName: string }[];
  ButtonRights?: { 
  ButtonName: string; 
  IsButtonMapped?: boolean;
  IsButtonMappedDisplay?: string;
  IsButtonActive?: boolean; 
}[];
}

export interface RolesResponse {
  DepartmentID: number;
  CompanyID: number;
  CompanyGroupID: number;
  CompanyName: string;
  CompanyGroupName: string;
  GroupID: number;
  GroupName: string;
  UserID: number;
  UserName: string;
  Menu: ApiMenu[];
}

export const getGroupRoles = (companyId: number, groupId: number) =>
  axiosClient
    .get('/api/role-management/group-roles', {
      params: { CompanyID: companyId, GroupID: groupId, ShowActiveOnly: 0 },
    })
    .then((r) => r.data);

export const saveGroupRoles = (data: unknown) =>
  axiosClient.post('/api/role-management/group-roles', data).then((r) => r.data);

export const getRoles = (
  companyId: number,
  groupId: number,
  userId = 0,
) =>
  axiosClient
    .get('/api/role-management/roles', {
      params: { CompanyID: companyId, GroupID: groupId, UserID: userId, ShowActiveOnly: 0 },
    })
    .then((r) => r.data);

export const getButtons = () =>
  axiosClient.get('/api/role-management/buttons').then((r) => r.data);

export const saveRoles = (data: unknown) =>
  axiosClient.post('/api/role-management/roles', data).then((r) => r.data);

export const getGroupUsers = (companyGroupId: number, groupId: number) =>
  axiosClient
    .get('/api/role-management/group-users', {
      params: { CompanyGroupID: companyGroupId, GroupID: groupId },
    })
    .then((r) => r.data);

export const getGroupUserDepartments = (companyGroupId: number, groupId: number, userId: number) =>
  axiosClient
    .get('/api/role-management/group-user-departments', {
      params: { CompanyGroupID: companyGroupId, GroupID: groupId, UserID: userId },
    })
    .then((r) => r.data);