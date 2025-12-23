/**
 * HubSpot Workflow Custom Code Action
 * =====================================
 *
 * Purpose: Generates SOW link and PIN when deal enters "needs review" status
 *
 * Trigger: Deal property sow_status = "needs_review"
 *
 * Outputs:
 *   - sow_link: Full URL to SOW approval page (e.g., https://sow.sunvena.com/12345-20241222)
 *   - sow_pin: 4-digit PIN for authentication
 *
 * These outputs can be used in subsequent workflow steps (e.g., email personalization tokens)
 *
 * Required Secrets (configure in workflow action settings):
 *   - HUBSPOT_ACCESS_TOKEN: Private app access token with deals read/write permissions
 *
 * Rate Limits:
 *   - Max execution time: 20 seconds
 *   - Max memory: 128 MB
 *
 * @see https://developers.hubspot.com/docs/api/automation-custom-code-actions
 */

const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {
  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  const SOW_BASE_URL = 'https://sow.sunvena.com';

  // =============================================================================
  // EXTRACT EVENT DATA
  // =============================================================================

  const dealId = event.object.objectId;
  const portalId = event.portalId;

  console.log(`Processing deal: ${dealId} in portal: ${portalId}`);

  try {
    // =============================================================================
    // INITIALIZE HUBSPOT CLIENT
    // =============================================================================

    const hubspotClient = new hubspot.Client({
      accessToken: process.env.HUBSPOT_ACCESS_TOKEN
    });

    // =============================================================================
    // FETCH DEAL PROPERTIES
    // =============================================================================

    // Get the deal to retrieve the needs_review_date for token generation
    const dealResponse = await hubspotClient.crm.deals.basicApi.getById(
      dealId,
      ['dealname', 'sales_rep_email', 'sow_needs_review_date']
    );

    const deal = dealResponse;
    console.log(`Deal name: ${deal.properties.dealname}`);

    // =============================================================================
    // GENERATE TOKEN
    // =============================================================================

    // Token format: {dealId}-{YYYYMMDD}
    // Example: 12345678-20241222

    let dateStr;
    if (deal.properties.sow_needs_review_date) {
      // Use the needs_review_date if set
      const needsReviewDate = new Date(deal.properties.sow_needs_review_date);
      dateStr = needsReviewDate.toISOString().split('T')[0].replace(/-/g, '');
    } else {
      // Fallback to current date
      dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    }

    const token = `${dealId}-${dateStr}`;
    console.log(`Generated token: ${token}`);

    // =============================================================================
    // GENERATE PIN
    // =============================================================================

    // Generate random 4-digit PIN (1000-9999)
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    console.log(`Generated PIN: ${pin}`);

    // =============================================================================
    // UPDATE DEAL WITH TOKEN AND PIN
    // =============================================================================

    await hubspotClient.crm.deals.basicApi.update(dealId, {
      properties: {
        sow_token: token,
        sow_pin: pin,
        // Also update needs_review_date if not already set
        sow_needs_review_date: deal.properties.sow_needs_review_date || new Date().toISOString()
      }
    });

    console.log('Deal updated with token and PIN');

    // =============================================================================
    // BUILD SOW LINK
    // =============================================================================

    const sowLink = `${SOW_BASE_URL}/${token}`;
    console.log(`SOW Link: ${sowLink}`);

    // =============================================================================
    // RETURN OUTPUT FIELDS
    // =============================================================================

    // These values are available as personalization tokens in subsequent workflow steps:
    //   - {{custom.sow_link}}
    //   - {{custom.sow_pin}}

    callback({
      outputFields: {
        sow_link: sowLink,
        sow_pin: pin
      }
    });

  } catch (error) {
    // =============================================================================
    // ERROR HANDLING
    // =============================================================================

    console.error('Error in SOW link generation:', error.message);
    console.error('Stack trace:', error.stack);

    // Return error information (workflow will show as failed)
    callback({
      outputFields: {
        error: `Failed to generate SOW link: ${error.message}`,
        sow_link: '',
        sow_pin: ''
      }
    });
  }
};


// =============================================================================
// TESTING NOTES
// =============================================================================
//
// To test this code in HubSpot workflow editor:
//
// 1. Create a test deal with all required properties
// 2. In the workflow editor, click "Test" on the custom code action
// 3. Select the test deal
// 4. Review console output and output fields
//
// Expected Output:
// {
//   "outputFields": {
//     "sow_link": "https://sow.sunvena.com/123456-20241222",
//     "sow_pin": "1234"
//   }
// }
//
// Common Issues:
// - "Cannot read property 'objectId' of undefined" → Event structure wrong, check trigger
// - "401 Unauthorized" → HUBSPOT_ACCESS_TOKEN secret not set or invalid
// - "Property doesn't exist" → Check property internal names match exactly
// =============================================================================
