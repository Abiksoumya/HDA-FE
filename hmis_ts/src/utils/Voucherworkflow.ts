// Workflow stages for vouchers — each value is the menu ID sent as WorkflowDocumentID.
export const VOUCHER_WORKFLOW = {
  CASH: { preparation: 2050505, passing: 2050510 },
  BANK: { preparation: 2051005, passing: 2051010 },
  JOURNAL: { preparation: 2051505, passing: 2051510 },
  CONTRA: { preparation: 2052005, passing: 2052010 },
  PAYABLE: { preparation: 2052505, approval: 2052510, passing: 2052515 },
  RECEIVABLE: { preparation: 2053005, passing: 2053010 },
} as const;

export type VoucherWorkflowType = keyof typeof VOUCHER_WORKFLOW;