import { axiosClient } from '@/utils/apiClient';

export const getAccountTypes = () =>
  axiosClient.get('/api/finance/account-types').then((r) => r.data);

export const getAccountTemplates = (pageNo = 1, pageSize = 100, groupAccountOnly = 'N') =>
  axiosClient
    .get('/api/finance/account-templates', {
      params: { PageNo: pageNo, PageSize: pageSize, GroupAccountOnly: groupAccountOnly },
    })
    .then((r) => r.data);

export const saveAccountTemplate = (data: unknown) =>
  axiosClient.post('/api/finance/account-templates', data).then((r) => r.data);

export const createBank = (data: unknown) =>
  axiosClient.post('/api/finance/banks', data).then((r) => r.data);

export const createBankBranch = (data: unknown) =>
  axiosClient.post('/api/finance/bank-branches', data).then((r) => r.data);

export const createBankAccount = (data: unknown) =>
    axiosClient.post('/api/finance/bank-accounts', data).then((r) => r.data);

export const getBanks = (showActiveOnly = 1) =>
  axiosClient
    .get('/api/finance/banks', { params: { ShowActiveOnly: showActiveOnly } })
        .then((r) => r.data);
    
export const getBankBranches = (bankId = 0, showActiveOnly = 1) =>
  axiosClient
    .get('/api/finance/bank-branches', {
      params: { BankID: bankId, ShowActiveOnly: showActiveOnly },
    })
    .then((r) => r.data);


  export const getSubLedgerTypes = () =>
  axiosClient.get('/api/finance/sub-ledger-types').then((r) => r.data);

export const getSubLedgerAccountTemplate = (subLedgerTypeId: number) =>
  axiosClient
    .get('/api/finance/sub-ledger-account-template', {
      params: { SubLedgerTypeID: subLedgerTypeId },
    })
    .then((r) => r.data);

export const saveSubLedgerAccountTemplate = (data: unknown) =>
  axiosClient.post('/api/finance/sub-ledger-account-template', data).then((r) => r.data);

export const getSubLedgerLookup = () =>
  axiosClient.get('/api/finance/sub-ledger-lookup').then((r) => r.data);

export const createSubLedger = (data: unknown) =>
  axiosClient.post('/api/finance/sub-ledger', data).then((r) => r.data);

export const getSubLedgerList = (companyId: number, companyGroupId: number, subLedgerTypeId: number, pageNo = 1, pageSize = 10) =>
  axiosClient
    .get('/api/finance/sub-ledger-list', {
      params: { CompanyID: companyId, CompanyGroupID: companyGroupId, SubLedgerTypeID: subLedgerTypeId, PageNo: pageNo, PageSize: pageSize },
    })
    .then((r) => r.data);

export const getSubLedgerById = (companyId: number, companyGroupId: number, subLedgerId: number) =>
  axiosClient
    .get('/api/finance/sub-ledger-by-id', {
      params: { CompanyID: companyId, CompanyGroupID: companyGroupId, SubLedgerID: subLedgerId },
    })
    .then((r) => r.data);

export const createSubLedgerEmployee = (data: unknown) =>
  axiosClient.post('/api/finance/sub-ledger-employee', data).then((r) => r.data);

export const getSubLedgerEmployeeList = (companyId: number, companyGroupId: number, subLedgerTypeId: number, pageNo = 1, pageSize = 10) =>
  axiosClient
    .get('/api/finance/sub-ledger-employee-list', {
      params: { CompanyID: companyId, CompanyGroupID: companyGroupId, SubLedgerTypeID: subLedgerTypeId, PageNo: pageNo, PageSize: pageSize },
    })
    .then((r) => r.data);

export const getSubLedgerEmployeeById = (companyId: number, companyGroupId: number, subLedgerId: number) =>
  axiosClient
    .get('/api/finance/sub-ledger-employee-by-id', {
      params: { CompanyID: companyId, CompanyGroupID: companyGroupId, SubLedgerID: subLedgerId },
    })
    .then((r) => r.data);

    export const getAccountTemplateMaps = (templateId = 0, pageNo = 1, pageSize = 20) =>
  axiosClient
    .get('/api/finance/account-template-maps', {
      params: { TemplateID: templateId,  PageNo: pageNo, PageSize: pageSize },
    })
    .then((r) => r.data);

export const createAccountTemplateMap = (data: unknown) =>
  axiosClient.post('/api/finance/account-template-maps', data).then((r) => r.data);

export const getSubLedgerByAccountId = (slAccountId: number, pageNo = 1, pageSize = 10) =>
  axiosClient
    .get('/api/finance/sub-ledger-by-account', {
      params: { SLAccountID: slAccountId, PageNo: pageNo, PageSize: pageSize },
    })
    .then((r) => r.data);


export const getAccountTemplateMapOnly = (templateId = 0, pageNo = 1, pageSize = 20) =>
  axiosClient
    .get('/api/finance/account-template-map-only', {
      params: { TemplateID: templateId, PageNo: pageNo, PageSize: pageSize },
    })
    .then((r) => r.data);

export const createBranchAccount = (data: unknown) =>
  axiosClient.post('/api/finance/branch-account', data).then((r) => r.data);

// Add to financeApi.ts:
export const getFinancialYears = () =>
  axiosClient.get('/api/profile/financial-years').then((r) => r.data);


export const getBranchGLAccountsForOpening = (
  companyId: number,
  companyGroupId: number,
  financialYearId: number,
  pageNo = 1,
  pageSize = 10
) =>
  axiosClient
    .get('/api/finance/gl-opening-balance', {
      params: {
        CompanyID: companyId,
        CompanyGroupID: companyGroupId,
        FinancialYearID: financialYearId,
        PageNo: pageNo,
        PageSize: pageSize,
      },
    })
    .then((r) => r.data);

export const saveBranchGLAccountsOpening = (data: unknown) =>
  axiosClient.post('/api/finance/gl-opening-balance', data).then((r) => r.data);


export const getBranchSLAccountsForOpening = (
  companyId: number,
  companyGroupId: number,
  financialYearId: number,
  glAccountId: number,
  pageNo = 1,
  pageSize = 10
) =>
  axiosClient
    .get('/api/finance/sl-opening-balance', {
      params: {
        CompanyID: companyId,
        CompanyGroupID: companyGroupId,
        FinancialYearID: financialYearId,
        GLAccountID: glAccountId,
        PageNo: pageNo,
        PageSize: pageSize,
      },
    })
    .then((r) => r.data);

export const saveBranchSLAccountsOpening = (data: unknown) =>
  axiosClient.post('/api/finance/sl-opening-balance', data).then((r) => r.data);


export const getCashBankAccountsForVoucher = (
  companyId: number,
  companyGroupId: number,
  financialYearId: number,
  accountType: 'CASH' | 'BANK' = 'CASH'
) =>
  axiosClient
    .get('/api/finance/cash-bank-accounts', {
      params: {
        CompanyID: companyId,
        CompanyGroupID: companyGroupId,
        FinancialYearID: financialYearId,
        AccountType: accountType,
      },
    })
    .then((r) => r.data);

export const getCashBankLedgerAccountsForVoucher = (
  companyId: number,
  companyGroupId: number,
  financialYearId: number
) =>
  axiosClient
    .get('/api/finance/cash-bank-ledger-accounts', {
      params: {
        CompanyID: companyId,
        CompanyGroupID: companyGroupId,
        FinancialYearID: financialYearId,
      },
    })
    .then((r) => r.data);

export const createCashBankVoucher = (data: unknown) =>
  axiosClient.post('/api/finance/cash-bank-voucher', data).then((r) => r.data);

export const getCostCentres = (branchCompanyId: number, groupCompanyId: number, glAccountId: number) =>
  axiosClient
    .get('/api/finance/cost-centres', {
      params: {
        BranchCompanyID: branchCompanyId,
        GroupCompanyID: groupCompanyId,
        GLAccountID: glAccountId,
      },
    })
    .then((r) => r.data);

export const getLocations = (branchCompanyId: number, groupCompanyId: number) =>
  axiosClient
    .get('/api/finance/locations', {
      params: {
        BranchCompanyID: branchCompanyId,
        GroupCompanyID: groupCompanyId,
      },
    })
    .then((r) => r.data);

// export const getVouchers = (
//   branchCompanyId: number,
//   groupCompanyId: number,
//   financialYearId: number,
//   documentTypeId = 1,
//   keyName = '',
//   keyValue = '',
//   pageNo = 1,
//   pageSize = 10
// ) =>
//   axiosClient
//     .get('/api/finance/vouchers', {
//       params: {
//         DocumentTypeID: documentTypeId,
//         BranchCompanyID: branchCompanyId,
//         GroupCompanyID: groupCompanyId,
//         FinancialYearID: financialYearId,
//         KeyName: keyName,
//         KeyValue: keyValue,
//         PageNo: pageNo,
//         PageSize: pageSize,
//       },
//     })
//     .then((r) => r.data);
export interface VoucherQueryParams {
  DocumentTypeID: number;
  BranchCompanyID: number;
  GroupCompanyID: number;
  FinancialYearID: number;
  WorkflowDocumentID?: number; // stage filter: 2050505 = prepared, 2050510 = passed (cash)
  KeyName: string;
  KeyValue: string;
  PageNo: number;
  PageSize: number;
}

export const getVouchers = (params: VoucherQueryParams) =>
  axiosClient.get('/api/finance/vouchers', { params }).then((r) => r.data);