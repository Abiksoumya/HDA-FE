// ── Auth ──────────────────────────────────────────────────
export interface User {
  login_user_full_name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user?: User;
  };
}

// ── OPD ──────────────────────────────────────────────────
export interface OpdState {
  opdData: Record<string, unknown>;
}

// ── UI ────────────────────────────────────────────────────
export interface UiState {
  sidebarOpen: boolean;
  activeItem: string;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// ── Modal ─────────────────────────────────────────────────
export interface ModalConfig {
  title?: string;
  message?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  children?: React.ReactNode;
  onClose?: (result: boolean) => void;
}

// ── Menu ──────────────────────────────────────────────────
export interface MenuItem {
  id: string | number;
  label: string;
  icon?: string | null;
  path?: string | null;
  children?: MenuItem[];
}

export interface RawMenuItem {
  menu_code: number;
  menu_key_code: string | number;
  menu_name: string;
  menu_icon?: string;
  menu_url?: string;
  menu_group_code: number;
}

// ── API generic wrapper ───────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// ── Company ───────────────────────────────────────────────
export interface Company {
  ADMIN_COMPANY_NID: number;
  ADMIN_COMPANY_NGRPID?: number;
  ADIMN_CMPN_LAYER_NID?: number;
  ADMIN_COMPANY_SNAME: string;
  ADMIN_COMPANY_SHORTNAME?: string;
  ADMIN_COMPANY_PROFILE_SADDR?: string;
  ADMIN_COMPANY_PROFILE_SADDR1?: string;
  ADMIN_COMPANY_PROFILE_SADDR2?: string;
  ADMIN_COMPANY_PROFILE_SPHONE?: string;
  ADMIN_COMPANY_PROFILE_SEMAIL?: string;
  ADMIN_COMPANY_PROFILE_SGST?: string;
  ADMIN_COMPANY_PROFILE_SPAN?: string;
  ADMIN_COMPANY_PROFILE_STAN?: string;
  HierarchyPath?: string;
  ADIMN_CMPN_LAYER_SDESC?: string;
  ADIMN_CMPN_LAYER_SDSPFLG?: string;
    ADMIN_COMPANY_INACTIVE?: boolean;

}

export interface CompanyLayer {
  ADIMN_CMPN_LAYER_NID: number;
  ADIMN_CMPN_LAYER_SDESC: string;
  ADIMN_CMPN_LAYER_SDSPFLG?: string;
}

export interface CompanyFormValues {
  p_ADMIN_COMPANY_NID: number;
  p_ADMIN_COMPANY_NGRPID: number;
  p_ADIMN_CMPN_LAYER_NID: number;
  p_ADMIN_COMPANY_SNAME: string;
  p_short_name: string;
  p_addr1: string;
  p_addr2: string;
  p_addr3: string;
  p_phone_no: string;
  p_email_no: string;
  p_gst_no: string;
  p_pan_no: string;
  p_tan_no: string;
  p_fax_no: string;
  p_inactive: boolean;
}

export interface CompanyPayload {
  CompanyID: number;
  Code: string;
  Description: string;
  LayerID: number;
  LevelNo: number;
  ParentCompanyID: number;
  MasterLevel: number;
  InActive: boolean;
  RecordState: number;
  Address: string;
  Address2: string;
  Address3: string;
  Phone: string;
  Fax: string;
  EMail: string;
  PANNo: string;
  TANNo: string;
  GSTIN: string;
}

// ── Department ────────────────────────────────────────────
export interface Department {
  ADMIN_DEPRT_NID: number;
  ADMIN_DEPRT_SNAME: string;
  ADMIN_DEPRT_SPREFIX?: string;
}

export interface DepartmentFormValues {
  p_ADMIN_DEPRT_NID: number;
  p_ADMIN_DEPRT_SNAME: string;
  p_ADMIN_DEPRT_SPREFIX: string;
}

// ── Admin Group ───────────────────────────────────────────
export interface AdminGroup {
  ADMIN_GROUP_NID: number;
  ADMIN_GROUP_NCMPNYID?: number;
  ADMIN_GROUP_NCMPNYGRPID?: number;
  ADMIN_GROUP_SDEFFLG?: string;
  ADMIN_GROUP_SNAME: string;
  ADMIN_COMPANY_SNAME?: string;
}

export interface AdminGroupFormValues {
  p_usergroup_id: number;
  p_group_company_nid: number;
  p_group_company_ngrpid: number;
  p_group_company_flag: string;
  p_usergroup_name: string;
}

// ── Company Department ────────────────────────────────────
export interface DeptMappingItem {
  ADMIN_DEPRT_NID: number;
  ADMIN_DEPRT_SNAME: string;
  IsSelected?: boolean | number;
  ADMIN_CMPNY_DEPRT_CTRL_NFLG?: boolean | number;
}

export interface CompanyDeptFormValues {
  ADMIN_CMPNY_DEPRT_NCMPNYID: number;
  ADMIN_CMPNY_DEPRT_NCMPNYGRPID: number;
  departments: {
    ADMIN_DEPRT_NID: number;
    IsSelected: number;
    ADMIN_CMPNY_DEPRT_CTRL_NFLG: number;
  }[];
}

// ── Dropdown options ──────────────────────────────────────
export interface GenderOption { GenderId: number; GenderName: string; }
export interface CountryOption { CountryId: number; CountryName: string; }
export interface StateOption { StateCode: number; StateName: string; }
export interface DistrictOption { DistrictId: number; DistrictName: string; }
export interface PSOption { PSId: number; PSName: string; }
export interface OpdOption { OPDCode: string; OPDDescription: string; }
export interface DoctorOption { DoctorsId: number; DoctorsDescription: string; Rate: number; }
export interface HospitalOption { HospitalCode: string; HospitalName: string; }
export interface ReferralHospitalOption { ReferenceId: number; ReferenceDescription: string; }
export interface MaritalStatusOption { MaritalStatusId: number; MaritalStatus: string; }
export interface ReligionOption { ReligionId: number; ReligionName: string; }
export interface EducationOption { EducationId: number; EducationName: string; }
export interface OccupationOption { OccupationId: number; OccupationDescription: string; }
export interface SportOption { SportId: number; SportName: string; }

// ── OPD Form ──────────────────────────────────────────────
export interface OpdFormValues {
  HospitalCode: string;
  oldOrNew: string;
  schemeId: string;
  toT_BILL_AMT: number;
  paiD_AMT: number;
  ipdEmergencyRegNo: string;
  outside_OPD_Reg_No: string;
  healthId: string;
  healthIdNumber: string;
  vsT_DT: string;
  vsT_TM: string;
  visit_Day: string;
  opD_REG_NO: string;
  f_NM: string;
  sex: string | number;
  adharNo: string;
  phoneNo: string;
  agE_YR: string | number;
  agE_MON: string | number;
  agE_DAYS: string | number;
  yearofBirth: string;
  dob: string;
  country: string | number;
  state: string | number;
  district: string | number;
  policE_STATION: string | number;
  pin: string;
  toT_ADD: string;
  opdCode: string;
  rooM_NO: string;
  doctorsId: string;
  complain: string;
  ref_From: boolean;
  opD_REG_SLN: string;
  ref_Date: string;
  ref_Time: string;
  refHospital: string | number;
  otherRef: string;
  ref_DocName: string;
  ref_Reason: string;
  maritalStatus: string;
  religion: string;
  education: string;
  occupation: string;
  income: string;
  incMonth: string;
  broughtbyRelation: string;
  informantNameRelation: string;
  sportAsseciatedWith: string | number;
  referredBy: string;
  reffrral: string;
  chiefcomplaints: string;
  opD_CD?: string;
  doC_CD?: string;
  refHospitalName?: string;
  [key: string]: unknown;
}

// ── File Upload ───────────────────────────────────────────
export interface FileItem {
  file: File | null;
  description: string;
}

// ── OPD List ──────────────────────────────────────────────
export interface OpdListItem {
  OPD_REG_NO: string;
  OPD_SL_NO: string;
  TotalRecords?: number;
}


