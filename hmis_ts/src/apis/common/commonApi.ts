import apiClient, { axiosClient } from '@/utils/apiClient';
import type {
  GenderOption, CountryOption, StateOption, DistrictOption,
  PSOption, HospitalOption, ReferralHospitalOption, MaritalStatusOption,
  ReligionOption, EducationOption, OccupationOption, SportOption,
  OpdListItem, ApiResponse,
} from '@/types';

type DD<T> = Promise<{ data: { data: T[] } }>;

export const fetchDropdownOptions = (endpoint: string) =>
  apiClient.get(endpoint).then((r) => r.data);

export const getMenus = (
  s_user_id: number,
  s_group_id: number,
  s_branch_id: number,
  s_dept_id: number,
  s_for_mobile: string,
) => {
  const params: Record<string, unknown> = {};
  if (s_user_id != null) params.p_user_id = s_user_id;
  if (s_group_id != null) params.p_group_id = s_group_id;
  if (s_branch_id != null) params.p_branch_id = s_branch_id;
  if (s_dept_id != null) params.p_dept_id = s_dept_id;
  if (s_for_mobile != null) params.p_for_mobile = s_for_mobile;
  return axiosClient.get('api/user/user-wise-menu-list', { params }).then((r) => r.data);
};

export const getHospitals = (): DD<HospitalOption> =>
  apiClient.get('ehims/common/master/GetHospitalName').then((r) => r.data);

export const getGenderList = (): DD<GenderOption> =>
  apiClient.get('ehims/common/master/GetGender').then((r) => r.data);

export const getCountryList = (): DD<CountryOption> =>
  apiClient.get('ehims/common/master/GetCountry').then((r) => r.data);

export const getStateList = (countryId: number | string): DD<StateOption> =>
  apiClient.get('ehims/common/master/GetState', { params: { CountryId: countryId } }).then((r) => r.data);

export const getDistrictList = (stateId: number | string): DD<DistrictOption> =>
  apiClient.get('ehims/common/master/GetDistrict', { params: { StateId: stateId } }).then((r) => r.data);

export const getPSList = (distId: number | string): DD<PSOption> =>
  apiClient.get('ehims/common/master/GetPs', { params: { DistrictId: distId } }).then((r) => r.data);

export const getReferralHospitalList = (): DD<ReferralHospitalOption> =>
  apiClient.get('ehims/common/Master/GetReferralHospital').then((r) => r.data);

export const getMaritalStatusList = (): DD<MaritalStatusOption> =>
  apiClient.get('ehims/common/Master/GetMaritalStatus').then((r) => r.data);

export const getReligionList = (): DD<ReligionOption> =>
  apiClient.get('ehims/common/Master/GetReligion').then((r) => r.data);

export const getEducationList = (): DD<EducationOption> =>
  apiClient.get('ehims/common/Master/GetEducation').then((r) => r.data);

export const getOccupationList = (): DD<OccupationOption> =>
  apiClient.get('ehims/common/Master/GetOccupation').then((r) => r.data);

export const getSportAssociatedwithList = (): DD<SportOption> =>
  apiClient.get('ehims/common/Master/GetSportAssociatedwith').then((r) => r.data);

export const getReffrralList = (): DD<ReferralHospitalOption> =>
  apiClient.get('ehims/common/Master/GetReffrral').then((r) => r.data);

export const getRommNo = (roomNo: string, opdCode: string, hospitalCode: string) =>
  apiClient
    .get('ehims/common/Master/GetRommNo', { params: { RoomNo: roomNo, OPDCode: opdCode, HospitalCode: hospitalCode } })
    .then((r) => r.data);

export const getPatientList = (OPDRegNo: string) =>
  apiClient
    .get('ehims/Opd/OPD/GetOPDPatientInfo2', { params: { OPDRegNo } })
    .then((r) => r.data);

export const getRegNoList = (
  PageNumber: number,
  PageSize: number,
): Promise<ApiResponse<OpdListItem[]>> =>
  apiClient
    .get('ehims/Opd/OPD/PopulateRegNo', { params: { PageNumber, PageSize } })
    .then((r) => r.data);
