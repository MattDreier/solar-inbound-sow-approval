/**
 * HubSpot API Client
 * ==================
 *
 * Provides methods for interacting with HubSpot CRM API for the SOW Approval System.
 *
 * ⚠️  TEMPORARY LIMITATION (2025-12-22)
 * =====================================
 * The Projects API (0-970) requires HubSpot account whitelisting.
 * Until whitelisted, all Projects API calls will return:
 *   HTTP 403: "The scope needed for this API call isn't available for public use"
 *
 * This is EXPECTED behavior. The configuration is correct - just awaiting HubSpot approval.
 * Continue using mock data for development. See CLAUDE.md for details.
 *
 * TODO: Remove this notice once whitelisting is confirmed.
 * =====================================
 *
 * Usage:
 *   import { HubSpotClient } from '@/lib/hubspot';
 *   const client = new HubSpotClient();
 *   const project = await client.findProjectByToken('12345-20241222');
 *
 * Required Environment Variables:
 *   - HUBSPOT_ACCESS_TOKEN: Private app access token
 *
 * @see https://developers.hubspot.com/docs/api/crm/deals
 * @see docs/PROJECTS_API_REFERENCE.md for Projects API (0-970) documentation
 */

import type { SOWData, SystemDetails, FinancingDetails, AdderDetails, CommissionBreakdown } from './types';
import { withSelfHealing } from './hubspot-setup';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * Properties to fetch from HubSpot deals for SOW display.
 * These must match the internal property names in HubSpot.
 */
export const SOW_PROPERTIES = [
  // Core SOW
  'sow_token',
  'sow_pin',
  'sow_status',
  'sow_needs_review_date',
  'sow_accepted_date',
  'sow_rejected_date',
  'sow_rejected_reason',

  // Customer
  'dealname',
  'customer_phone',
  'customer_email',
  'customer_address',

  // Sales
  'sales_rep_name',
  'sales_rep_email',
  'setter',
  'lead_source',

  // System
  'system_size',
  'panel_type',
  'panel_count',
  'inverter_type',
  'inverter_count',
  'battery_type',
  'battery_count',

  // Financing
  'lender',
  'term_length',
  'finance_type',
  'interest_rate',
  'total_contract_amount',
  'dealer_fee_amount',

  // Adders (all 32)
  'additional_wire_run',
  'battery_adder',
  'battery_inside_garage',
  'battery_on_mobile_home',
  'concrete_coated',
  'detach_and_reset',
  'ground_mount',
  'high_roof',
  'inverter_adder',
  'level2_charger_install',
  'lightreach_adder',
  'metal_roof',
  'meter_main',
  'mpu',
  'misc_electrical',
  'module_adder',
  'mounting_adder',
  'new_roof',
  'project_hats',
  'span_smart_panel',
  'solar_insure',
  'solar_insure_with_battery',
  'steep_roof',
  'structural_reinforcement',
  'tesla_ev_charger',
  'tier2_insurance',
  'tile_roof_metal_shingle',
  'travel_adder',
  'tree_trimming',
  'trench_over_100ft',
  'wallbox_charger',
  'subpanel_100a',
  'adders_total',

  // Commission
  'gross_ppw',
  'total_adders_ppw',
  'net_ppw',
  'total_commission',

  // Files
  'proposal_image',
  'plan_file',
];

/**
 * Search filter configuration for HubSpot API.
 */
interface SearchFilter {
  propertyName: string;
  operator: 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'HAS_PROPERTY' | 'NOT_HAS_PROPERTY' | 'CONTAINS_TOKEN' | 'NOT_CONTAINS_TOKEN';
  value?: string;
}

interface SearchFilterGroup {
  filters: SearchFilter[];
}

interface SearchRequest {
  filterGroups: SearchFilterGroup[];
  properties: string[];
  limit?: number;
}

interface HubSpotDeal {
  id: string;
  properties: Record<string, string | null>;
  createdAt: string;
  updatedAt: string;
}

interface SearchResponse {
  total: number;
  results: HubSpotDeal[];
}

/**
 * HubSpot API Client for SOW Approval System.
 */
export class HubSpotClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.HUBSPOT_ACCESS_TOKEN || '';
    if (!this.accessToken) {
      throw new Error('HUBSPOT_ACCESS_TOKEN is required');
    }
  }

  /**
   * Make an authenticated request to HubSpot API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${HUBSPOT_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Search for deals using HubSpot's search API.
   * Wrapped with self-healing: if a property was deleted, it recreates it and retries.
   */
  async searchDeals(request: SearchRequest): Promise<SearchResponse> {
    return withSelfHealing(
      () => this.request<SearchResponse>('/crm/v3/objects/deals/search', {
        method: 'POST',
        body: JSON.stringify({
          filterGroups: request.filterGroups,
          properties: request.properties,
          limit: request.limit || 10,
        }),
      }),
      'searchDeals'
    );
  }

  /**
   * Find a deal by its SOW token.
   */
  async findDealByToken(token: string): Promise<HubSpotDeal | null> {
    const response = await this.searchDeals({
      filterGroups: [{
        filters: [{
          propertyName: 'sow_token',
          operator: 'EQ',
          value: token,
        }],
      }],
      properties: SOW_PROPERTIES,
      limit: 1,
    });

    return response.results[0] || null;
  }

  /**
   * Get a deal by its ID.
   * Wrapped with self-healing: if a property was deleted, it recreates it and retries.
   */
  async getDeal(dealId: string, properties: string[] = SOW_PROPERTIES): Promise<HubSpotDeal> {
    const propertyList = properties.join(',');
    return withSelfHealing(
      () => this.request<HubSpotDeal>(
        `/crm/v3/objects/deals/${dealId}?properties=${propertyList}`
      ),
      `getDeal(${dealId})`
    );
  }

  /**
   * Update deal properties.
   * Wrapped with self-healing: if a property was deleted, it recreates it and retries.
   */
  async updateDeal(
    dealId: string,
    properties: Record<string, string | number | null>
  ): Promise<HubSpotDeal> {
    return withSelfHealing(
      () => this.request<HubSpotDeal>(`/crm/v3/objects/deals/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      }),
      `updateDeal(${dealId})`
    );
  }

  /**
   * Verify a PIN against a deal's stored PIN.
   */
  async verifyPin(token: string, pin: string): Promise<{
    valid: boolean;
    dealId?: string;
    status?: string;
    error?: string;
  }> {
    const deal = await this.findDealByToken(token);

    if (!deal) {
      return { valid: false, error: 'Invalid token' };
    }

    const storedPin = deal.properties.sow_pin;
    const status = deal.properties.sow_status;

    if (status !== 'needs_review') {
      return {
        valid: false,
        dealId: deal.id,
        status: status || undefined,
        error: `SOW already ${status}`,
      };
    }

    if (pin !== storedPin) {
      return { valid: false, error: 'Invalid PIN' };
    }

    return { valid: true, dealId: deal.id, status: status || undefined };
  }

  /**
   * Get SOW data formatted for the frontend.
   */
  async getSOWData(token: string): Promise<SOWData | null> {
    const deal = await this.findDealByToken(token);
    if (!deal) return null;
    return this.mapDealToSOWData(deal);
  }

  /**
   * Map a HubSpot deal to the SOWData format used by the frontend.
   */
  private mapDealToSOWData(deal: HubSpotDeal): SOWData {
    const p = deal.properties;

    const system: SystemDetails = {
      size: p.system_size || '',
      panelType: p.panel_type || '',
      panelCount: p.panel_count || '',
      inverterType: p.inverter_type || '',
      inverterCount: p.inverter_count || '',
      batteryType: p.battery_type || null,
      batteryCount: p.battery_count || null,
    };

    const financing: FinancingDetails = {
      lender: p.lender || '',
      termLength: p.term_length || '',
      financeType: p.finance_type || '',
      interestRate: p.interest_rate || '',
      totalContractAmount: p.total_contract_amount || '',
      dealerFeeAmount: p.dealer_fee_amount || null,
    };

    const adders: AdderDetails = {
      additionalWireRun: this.parseNumber(p.additional_wire_run),
      batteryAdder: this.parseNumber(p.battery_adder),
      batteryInsideGarage: this.parseNumber(p.battery_inside_garage),
      batteryOnMobileHome: this.parseNumber(p.battery_on_mobile_home),
      concreteCoated: this.parseNumber(p.concrete_coated),
      detachAndReset: this.parseNumber(p.detach_and_reset),
      groundMount: this.parseNumber(p.ground_mount),
      highRoof: this.parseNumber(p.high_roof),
      inverterAdder: this.parseNumber(p.inverter_adder),
      level2ChargerInstall: this.parseNumber(p.level2_charger_install),
      lightreachAdder: this.parseNumber(p.lightreach_adder),
      metalRoof: this.parseNumber(p.metal_roof),
      meterMain: this.parseNumber(p.meter_main),
      mpu: this.parseNumber(p.mpu),
      miscElectrical: this.parseNumber(p.misc_electrical),
      moduleAdder: this.parseNumber(p.module_adder),
      mountingAdder: this.parseNumber(p.mounting_adder),
      newRoof: this.parseNumber(p.new_roof),
      projectHats: this.parseNumber(p.project_hats),
      spanSmartPanel: this.parseNumber(p.span_smart_panel),
      solarInsure: this.parseNumber(p.solar_insure),
      solarInsureWithBattery: this.parseNumber(p.solar_insure_with_battery),
      steepRoof: this.parseNumber(p.steep_roof),
      structuralReinforcement: this.parseNumber(p.structural_reinforcement),
      teslaEvCharger: this.parseNumber(p.tesla_ev_charger),
      tier2Insurance: this.parseNumber(p.tier2_insurance),
      tileRoofMetalShingle: this.parseNumber(p.tile_roof_metal_shingle),
      travelAdder: this.parseNumber(p.travel_adder),
      treeTrimming: this.parseNumber(p.tree_trimming),
      trenchOver100ft: this.parseNumber(p.trench_over_100ft),
      wallboxCharger: this.parseNumber(p.wallbox_charger),
      subpanel100a: this.parseNumber(p.subpanel_100a),
      addersTotal: this.parseNumber(p.adders_total) || 0,
    };

    const commission: CommissionBreakdown = {
      grossPpw: p.gross_ppw || '',
      totalAddersPpw: p.total_adders_ppw || '',
      netPpw: p.net_ppw || '',
      totalCommission: p.total_commission || '',
    };

    // Map SOW status
    let status: 'pending' | 'approved' | 'rejected' = 'pending';
    if (p.sow_status === 'approved') status = 'approved';
    else if (p.sow_status === 'rejected') status = 'rejected';
    else if (p.sow_status === 'needs_review') status = 'pending';

    return {
      dealId: deal.id,
      token: p.sow_token || '',
      pin: p.sow_pin || '',
      status,
      generatedAt: p.sow_needs_review_date || new Date().toISOString(),
      approvedAt: p.sow_accepted_date || null,
      approvedBy: null, // Not stored separately in this implementation
      rejectedAt: p.sow_rejected_date || null,
      rejectionReason: p.sow_rejected_reason || null,
      customer: {
        name: p.dealname || '',
        phone: p.customer_phone || '',
        email: p.customer_email || '',
        address: p.customer_address || '',
      },
      salesRep: {
        name: p.sales_rep_name || '',
        email: p.sales_rep_email || '',
      },
      setter: p.setter || '',
      leadSource: p.lead_source || '',
      system,
      financing,
      adders,
      commission,
      proposalImageUrl: p.proposal_image || '',
      planFileUrl: p.plan_file || '',
    };
  }

  /**
   * Parse a string value to number, returning null if invalid.
   */
  private parseNumber(value: string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
}

/**
 * Singleton instance for use in API routes.
 */
let clientInstance: HubSpotClient | null = null;

export function getHubSpotClient(): HubSpotClient {
  if (!clientInstance) {
    clientInstance = new HubSpotClient();
  }
  return clientInstance;
}

// Re-export setup utilities for convenience
export {
  ensureHubSpotSetup,
  getSetupResult,
  isSetupComplete,
  withSelfHealing,
} from './hubspot-setup';
