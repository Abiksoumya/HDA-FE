import { axiosClient } from '@/utils/apiClient';

export const getAccountTypes = () =>
  axiosClient.get('/api/finance/account-types').then((r) => r.data);

export const getAccountTemplates = (pageNo = 1, pageSize = 10, groupAccountOnly = 'N') =>
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

    export const getAccountTemplateMaps = (templateId = 0, showActiveOnly = 1, pageNo = 1, pageSize = 20) =>
  axiosClient
    .get('/api/finance/account-template-maps', {
      params: { TemplateID: templateId, ShowActiveOnly: showActiveOnly, PageNo: pageNo, PageSize: pageSize },
    })
    .then((r) => r.data);

export const createAccountTemplateMap = (data: unknown) =>
  axiosClient.post('/api/finance/account-template-maps', data).then((r) => r.data);