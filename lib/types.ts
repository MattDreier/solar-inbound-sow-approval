// SOW Status enum matching HubSpot design_status
export type SOWStatus = 'pending' | 'approved' | 'rejected';

// Main SOW data structure matching PRD API response
export interface SOWData {
  dealId: string;
  token: string;
  pin: string;
  status: SOWStatus;
  generatedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;

  customer: CustomerInfo;
  salesRep: SalesRepInfo;
  setter: string;
  leadSource: string;

  system: SystemDetails;
  financing: FinancingDetails;
  adders: AdderDetails;
  commission: CommissionBreakdown;

  proposalImageUrl: string;
  planFileUrl: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface SalesRepInfo {
  name: string;
  email: string;
}

export interface SystemDetails {
  size: string;           // "7.47" (kW)
  panelType: string;      // "Trina Solar TSM-NE09RC.05 415W"
  panelCount: string;     // "18"
  inverterType: string;   // "SolarEdge SE7600H-US with U650 optimizers"
  inverterCount: string;  // "1"
  batteryType: string | null;
  batteryCount: string | null;
}

export interface FinancingDetails {
  lender: string;
  termLength: string;     // "25" (years)
  financeType: string;    // "Lease" | "Loan" | "Cash"
  interestRate: string;   // "1.99" (%)
  totalContractAmount: string;  // "27004.54"
  dealerFeeAmount: string | null;
}

// All adder fields as optional numbers (matching HubSpot schema)
export interface AdderDetails {
  additionalWireRun: number | null;
  batteryAdder: number | null;
  batteryInsideGarage: number | null;
  batteryOnMobileHome: number | null;
  concreteCoated: number | null;
  detachAndReset: number | null;
  groundMount: number | null;
  highRoof: number | null;
  inverterAdder: number | null;
  level2ChargerInstall: number | null;
  lightreachAdder: number | null;
  metalRoof: number | null;
  meterMain: number | null;
  mpu: number | null;
  miscElectrical: number | null;
  moduleAdder: number | null;
  mountingAdder: number | null;
  newRoof: number | null;
  projectHats: number | null;
  spanSmartPanel: number | null;
  solarInsure: number | null;
  solarInsureWithBattery: number | null;
  steepRoof: number | null;
  structuralReinforcement: number | null;
  teslaEvCharger: number | null;
  tier2Insurance: number | null;
  tileRoofMetalShingle: number | null;
  travelAdder: number | null;
  treeTrimming: number | null;
  trenchOver100ft: number | null;
  wallboxCharger: number | null;
  subpanel100a: number | null;
  addersTotal: number;
}

export interface CommissionBreakdown {
  grossPpw: string;      // "2.82"
  totalAddersPpw: string; // "0.1"
  netPpw: string;        // "3.71"
  totalCommission: string; // "8677.2"
}

// API request/response types
export interface VerifyPinRequest {
  token: string;
  pin: string;
}

export interface VerifyPinResponse {
  valid: boolean;
  error?: string;
}

export interface ApproveSOWRequest {
  token: string;
  approverEmail: string;
}

export interface RejectSOWRequest {
  token: string;
  reason: string;
  rejecterEmail: string;
}

// State stored in localStorage
export interface SOWState {
  status: SOWStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}
