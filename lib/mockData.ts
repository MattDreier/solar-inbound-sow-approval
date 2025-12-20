import { SOWData } from './types';

// Mock data based on dummy PDF (Petar Garov deal)
export const MOCK_SOW_DATA: Record<string, SOWData> = {
  'demo-token-abc123xyz789': {
    dealId: '1746923407438',
    token: 'demo-token-abc123xyz789',
    pin: '1234',
    status: 'pending',
    generatedAt: '2025-05-05T12:00:00Z',
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,

    customer: {
      name: 'John Anderson',
      phone: '(555) 123-4567',
      email: 'john.anderson@example.com',
      address: '1234 Sunshine Blvd, Tampa, FL 33602'
    },

    salesRep: {
      name: 'Hunter',
      email: 'hunter@sunvena.com'
    },

    setter: 'John Setter',
    leadSource: 'Referral',

    system: {
      size: '7.47',
      panelType: 'Trina Solar TSM-NE09RC.05 415W',
      panelCount: '18',
      inverterType: 'SolarEdge SE7600H-US with U650 optimizers',
      inverterCount: '1',
      batteryType: null,
      batteryCount: null
    },

    financing: {
      lender: 'GoodLeap TPO',
      termLength: '25',
      financeType: 'Lease',
      interestRate: '1.99',
      totalContractAmount: '27004.54',
      dealerFeeAmount: null
    },

    adders: {
      additionalWireRun: null,
      batteryAdder: null,
      batteryInsideGarage: null,
      batteryOnMobileHome: null,
      concreteCoated: null,
      detachAndReset: null,
      groundMount: null,
      highRoof: null,
      inverterAdder: 767,
      level2ChargerInstall: null,
      lightreachAdder: null,
      metalRoof: null,
      meterMain: null,
      mpu: null,
      miscElectrical: null,
      moduleAdder: null,
      mountingAdder: null,
      newRoof: null,
      projectHats: null,
      spanSmartPanel: null,
      solarInsure: null,
      solarInsureWithBattery: null,
      steepRoof: null,
      structuralReinforcement: null,
      teslaEvCharger: null,
      tier2Insurance: null,
      tileRoofMetalShingle: null,
      travelAdder: null,
      treeTrimming: null,
      trenchOver100ft: null,
      wallboxCharger: null,
      subpanel100a: null,
      addersTotal: 767
    },

    commission: {
      grossPpw: '2.82',
      totalAddersPpw: '0.1',
      netPpw: '3.71',
      totalCommission: '8677.20'
    },

    proposalImageUrl: '/dummy-data/proposal_1746923407438.png',
    planFileUrl: '/dummy-data/plan_1746923407438.pdf'
  }
};

// Helper to get SOW by token
export function getSOWByToken(token: string): SOWData | null {
  return MOCK_SOW_DATA[token] || null;
}

// Helper to verify PIN
export function verifyPIN(token: string, pin: string): boolean {
  const sow = getSOWByToken(token);
  return sow ? sow.pin === pin : false;
}
