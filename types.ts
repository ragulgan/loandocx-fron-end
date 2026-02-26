export enum UserType {
  ADMIN = 'AD',
  AGENT = 'AT',
  LEGAL_USER = 'LU',
  LEGAL_HEAD = 'LH',
  CIVIL_USER = 'CU'
}

export enum TransactionState {
  PENDING = 'P',
  CREATED = '1',
  ADMIN_APPROVED = '2',
  ASSIGNED_TO_LEGAL = '3',
  LEGAL_COMPLETED = '4',
  ASSIGNED_TO_CIVIL = '5',
  CIVIL_COMPLETED = '6',
  ASSIGNED_TO_LEGAL_HEAD = '7',
  LEGAL_HEAD_COMPLETED = '8',
  SENT_TO_BANK = '9',
  COMPLETED = 'C',
  REJECTED = 'R',
  ARCHIVED = 'A'
}

export interface UserScreen {
  screen_name: string;
  screen_url: string;
}

export interface UserProfile {
  user_id: number;
  user_name: string;
  user_type: UserType;
  user_pwd?: string;
  upi_id?: string;
  address1?: string;
  address2?: string;
  user_mobile?: string;
  email_id: string;
  aadhar_number?: string;
  user_active: 'Y' | 'N';
  screens?: UserScreen[];
  token : string;
}

export interface CustomerLoanDetails {
  customer_id: number;
  customer_name: string;
  loan_name: string;
  upi_id?: string;
  address1: string;
  address2?: string;
  mobile_number: string;
  email_id: string;
  aadhar_number: string;
  pan_card_number: string;
  loan_amount: number;
  processing_fees: number;
  amount_received: number;
  transaction_id: number;
  agent_id: number;
  creation_date: string;
  loan_process_status: string;
  Loan_bank_name: string;
  Loan_branch_name: string;
  Loan_branch_address1: string;
  Loan_branch_address2?: string;
  Loan_branch_mailid: string;
  Document_Stored_path?: string;
}