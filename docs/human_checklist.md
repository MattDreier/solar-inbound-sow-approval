# Human Checklist - SOW Approval System

**Estimated Total Time:** 3-4 hours
**Prerequisites:** HubSpot Super Admin access, Vercel account admin access

---

## Overview

This checklist guides you through the complete setup process for the SOW Approval System:

1. **Phase 1:** Create HubSpot private app and get the access token (15 mins)
2. **Phase 2:** Hand off to developers with token and repository access (5 mins)
3. **Developer Phase:** Developers integrate HubSpot API (you're available for questions)
4. **Phase 3:** Deploy to Vercel after development is complete (45 mins)
5. **Phase 4:** Configure DNS through contractor (30 mins coordination)
6. **Phase 5:** Set up HubSpot webhook + workflow for SOW emails (45 mins)
7. **Phase 6:** End-to-end testing (30 mins)
8. **Phase 7:** Go live (monitoring setup)

---

## Phase 1: Pre-Development Setup (Do This First)

### 1.1 Create HubSpot Private App

- [ ] Log into HubSpot → Settings (gear icon)
- [ ] Navigate to: Integrations → Private Apps
- [ ] Click "Create private app"
- [ ] Configure:
  - **Name:** `SOW Approval System`
  - **Description:** `Backend integration for SOW approval workflow`

**⚠️ CRITICAL:** The access token is shown only once after creation.

- [ ] **Copy the access token immediately**
- [ ] **Store it securely** (password manager recommended)
- [ ] **You will give this token to developers** (use secure method - not email/Slack)

### 1.2 Configure Scopes

Select the following scopes for the private app:

| Scope | Permission | Purpose |
|-------|------------|---------|
| `crm.objects.projects.read` | Read | Fetch project data for SOW display |
| `crm.objects.projects.write` | Write | Update project status after approval/rejection |
| `crm.schemas.projects.read` | Read | Read property definitions |
| `crm.schemas.projects.write` | Write | Create custom properties (one-time) |
| `files` | Read/Write | Upload and read PDF files in HubSpot |

> **Note:** HubSpot does not have dedicated `crm.objects.notes.*` scopes. The Notes API inherits permissions from parent object scopes. With `crm.objects.projects.write`, you can create notes associated with Projects.

**Note:** The system uses HubSpot Projects API (beta), object type `0-970`. See `docs/PROJECTS_API_REFERENCE.md` for detailed API documentation.

- [ ] All scopes selected and saved
- [ ] App created successfully
- [ ] Access token copied and stored securely

### 1.3 Verify Existing Project Properties

These properties should already exist on your project records. Verify their internal names match what the app expects:

**Customer Information:**
- [ ] `hs_name` (project name - standard HubSpot Projects property)
- [ ] `customer_phone`
- [ ] `customer_email`
- [ ] `customer_address`

**Sales Information:**
- [ ] `sales_rep_name`
- [ ] `sales_rep_email`
- [ ] `setter`
- [ ] `lead_source`

**System Information:**
- [ ] `system_size`
- [ ] `panel_type`, `panel_count`
- [ ] `inverter_type`, `inverter_count`
- [ ] `battery_type`, `battery_count` (optional)

**Financing:**
- [ ] `lender`, `term_length`, `finance_type`, `interest_rate`
- [ ] `total_contract_amount`, `dealer_fee_amount`

**Adders & Commission:**
- [ ] All 32 adder properties (see `lib/types.ts` for complete list)
- [ ] `gross_ppw`, `total_adders_ppw`, `net_ppw`, `total_commission`

**Files:**
- [ ] `proposal_image` (URL to proposal image)
- [ ] `plan_file` (URL to plan PDF)

**If any property names differ from expected:**
- [ ] Document the actual internal name
- [ ] Share this information with developers for `lib/hubspot.ts` mapping

### 1.4 Hand Off to Developers

- [ ] Securely provide developers with:
  - [ ] HubSpot private app access token
  - [ ] Link to `docs/DEVELOPER_HANDOFF.md`
  - [ ] Repository access (GitHub/GitLab)
  - [ ] List of any property name discrepancies from Step 1.3
- [ ] Confirm developers have received all information

---

## Phase 2: Developer Implementation (Reference Only)

**What developers will do:**

1. Wire up API routes to HubSpot API (replacing mock data)
2. Implement HubSpot property auto-creation logic
3. Build PDF generation functionality
4. Test locally with provided access token
5. Verify all HubSpot integrations work correctly

**See `docs/DEVELOPER_HANDOFF.md` for complete developer task list.**

**Your role during this phase:**
- [ ] Available to answer HubSpot-specific questions
- [ ] Provide test project IDs if needed for validation
- [ ] Review and approve when developers signal completion

**Wait for developer completion before proceeding to Phase 3.**

---

## Phase 3: Post-Development Deployment

### 3.1 Vercel Deployment Setup

#### Connect Repository
- [ ] Log into Vercel
- [ ] Click "Add New..." → "Project"
- [ ] Import project from Git
- [ ] Select repository: `Solar Inbound SOW Approval`
- [ ] Framework preset: Next.js (should auto-detect)

#### Configure Environment Variables

Navigate to: Project Settings → Environment Variables

Add these variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `HUBSPOT_ACCESS_TOKEN` | `pat-na1-...` (from Phase 1) | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://sow.sunvena.com` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://<preview-url>.vercel.app` | Preview |
| `HEALTH_CHECK_API_KEY` | Generate: `openssl rand -hex 32` | Production, Preview |

**Note on `HEALTH_CHECK_API_KEY`:**
- Enables detailed diagnostics at `/api/health`
- Without it, endpoint returns only basic status
- Run `openssl rand -hex 32` in terminal to generate
- Copy the output as the value

- [ ] All environment variables added
- [ ] Sensitive values encrypted (shown as hidden)
- [ ] Double-checked no typos in variable names

#### Configure Custom Domain

- [ ] Go to: Project → Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter domain: `sow.sunvena.com`
- [ ] Vercel will show required DNS records
- [ ] **Copy these DNS values** (CNAME target, TXT verification)
- [ ] **Keep this page open** - you'll need it for Phase 4

#### Deploy

- [ ] Go to Deployments tab
- [ ] Click "Redeploy" (if needed) or push to main branch
- [ ] Wait for build to complete
- [ ] Verify build logs show no errors
- [ ] Check function logs for any runtime errors

---

## Phase 4: DNS Configuration

### 4.1 Gather DNS Information from Vercel

From Vercel domain settings (should still be open), collect:

- [ ] CNAME target: `cname.vercel-dns.com`
- [ ] TXT verification record (if shown): `_vercel` → `vc-domain-verify=...`

### 4.2 Send Email to DNS Contractor

Use the template in `docs/dns-contractor-email.md`:

- [ ] Open the template file
- [ ] Replace placeholders with actual values from Vercel
- [ ] Send to contractor managing sunvena.com DNS
- [ ] CC yourself and project stakeholders
- [ ] **Follow up within 24 hours if no response**

### 4.3 Verify DNS Propagation

After contractor confirms changes:

**Wait 5-10 minutes for DNS propagation**, then verify:

```bash
# Check CNAME record
dig CNAME +short sow.sunvena.com
# Expected output: cname.vercel-dns.com

# Check TXT verification record (if required)
dig TXT +short _vercel.sunvena.com
# Expected output: "vc-domain-verify=..."
```

**In Vercel Dashboard:**
- [ ] Go to Project → Settings → Domains
- [ ] Check status of `sow.sunvena.com`
- [ ] Should show "Valid Configuration" (green checkmark)
- [ ] SSL certificate should show as "Active"

**In Browser:**
- [ ] Visit `https://sow.sunvena.com`
- [ ] Should load without SSL warnings
- [ ] Verify it shows the app (not 404)

**If DNS not propagating after 1 hour:**
- [ ] Contact contractor to verify records were added correctly
- [ ] Use online DNS checker: `https://dnschecker.org/`
- [ ] Check for typos in CNAME/TXT values

---

## Phase 5: HubSpot Integration Setup (Two-Phase Architecture)

**⚠️ Important:** Do this AFTER deployment and DNS are complete, so the SOW links work correctly.

**Architecture Overview:**
- **Phase 1 (Webhook):** Generates token/PIN when `send_rep_commission_sow` = "yes"
- **Phase 2 (Workflow):** Sends email when token/PIN are populated

**Why Two Phases?** Private apps cannot programmatically enroll records in workflows. The webhook generates data; the workflow sends the email independently.

### 5.1 Configure Webhook Subscription (Token/PIN Generation)

Navigate to your Private App settings:

- [ ] HubSpot → Settings → Integrations → Private Apps
- [ ] Select your SOW Approval app
- [ ] Click "Webhooks" tab

#### Add Webhook Subscription

- [ ] Click "Create subscription"
- [ ] Object type: **Projects** (or select `0-970`)
- [ ] Event type: **Property changed**
- [ ] Property: `send_rep_commission_sow`
- [ ] Target URL: `https://sow.sunvena.com/api/generate-sow`
- [ ] Save subscription

**What happens when webhook fires:**
1. Design team sets `send_rep_commission_sow` = "yes" on a Project
2. HubSpot POSTs to `/api/generate-sow`
3. Endpoint generates unique token + 4-digit PIN
4. Endpoint updates Project with token, PIN, and `sow_status` = "needs_review"

### 5.2 Create Email Workflow

- [ ] Navigate to: HubSpot → Automation → Workflows
- [ ] Click "Create workflow"
- [ ] Choose: **Project-based** workflow
- [ ] Start from scratch
- [ ] Name: `SOW Email to Rep`

### 5.3 Configure Enrollment Criteria

The workflow enrolls when ALL conditions are true (webhook has done its job):

- [ ] Click "Set enrollment trigger"
- [ ] Choose: Property-based trigger
- [ ] Add **three** filter conditions (AND logic):

**Condition 1:**
- [ ] Property: `send_rep_commission_sow`
- [ ] Condition: `is equal to` → `yes`

**Condition 2:**
- [ ] Click "AND" to add another condition
- [ ] Property: `sow_token`
- [ ] Condition: `is known`

**Condition 3:**
- [ ] Click "AND" to add another condition
- [ ] Property: `sow_pin`
- [ ] Condition: `is known`

**Re-enrollment settings:**
- [ ] Toggle ON: "Re-enroll records when they meet the trigger criteria again"
- [ ] (This allows re-sending if token/PIN are regenerated)

### 5.4 Add Send Email Action

- [ ] Click `+` button to add action
- [ ] Search for: "Send email"
- [ ] Select: Send email action

#### Email Configuration

**Recipients:**
- [ ] To: **Custom email**
- [ ] Click "Use personalization token"
- [ ] Select: `Sales rep email` (or `sales_rep_email` property)

**Email Details:**
- [ ] Subject: `Action Required: SOW Review for {{hs_name}}`
- [ ] From name: `Sunvena Solar Team` (or your company name)
- [ ] From email: Use verified sender email

**Email Body:**

Click "Edit in rich text editor" and paste this template:

```
Hi {{sales_rep_name}},

A new Scope of Work is ready for your review and approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Customer: {{hs_name}}
System Size: {{system_size}} kW
Address: {{customer_address}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCESS YOUR SOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Click here to review: https://sow.sunvena.com/sow/{{sow_token}}

🔐 Your PIN: {{sow_pin}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review all details carefully before approving or rejecting.

If you reject, please provide a detailed reason so our design team can address any issues.

This link is unique to this SOW and will no longer work once the review is complete.

Questions? Contact the design team.

Best regards,
Sunvena Solar Team
```

**Verify Personalization Tokens:**
- [ ] Click "Preview" to check token values
- [ ] Verify link contains the `sow_token` value
- [ ] Verify `sow_pin` shows 4-digit PIN
- [ ] All other tokens populate correctly

- [ ] Save email configuration

### 5.5 Review and Publish Workflow

- [ ] Review all workflow steps:
  1. Enrollment criteria (send_rep_commission_sow=yes AND sow_token known AND sow_pin known)
  2. Send email action (sends link to sales rep using project properties)
- [ ] Click "Review and publish"
- [ ] Toggle workflow to **ON**
- [ ] Click "Turn on" to activate workflow
- [ ] Workflow is now live and will process projects when criteria met

---

## Phase 6: End-to-End Testing

### 6.1 Create Test Project

- [ ] In HubSpot, create a new project OR select existing test project
- [ ] Fill in all required properties:
  - [ ] Customer information (name, email, phone, address)
  - [ ] Sales rep information (name, email)
  - [ ] System details (size, panels, inverters)
  - [ ] Financing details
  - [ ] Commission breakdown
  - [ ] File URLs (proposal image, plan PDF)
- [ ] Set `send_rep_commission_sow` to `no` initially
- [ ] Save project

### 6.2 Trigger Token Generation

- [ ] Edit the test project
- [ ] Change `send_rep_commission_sow` to `yes`
- [ ] Save project

**Monitor Webhook Execution:**
- [ ] Wait 5-10 seconds for webhook to fire
- [ ] Refresh the project page
- [ ] Verify `sow_token` is now populated
- [ ] Verify `sow_pin` is now populated (4 digits)
- [ ] Verify `sow_status` changed to `needs_review`

**Monitor Workflow Execution:**
- [ ] Go to: Automation → Workflows → SOW Email to Rep
- [ ] Click "History" tab
- [ ] Find your test project enrollment
- [ ] Verify it shows "Completed" (not "Failed")
- [ ] If failed, click to see error details

**Check Email Delivery:**
- [ ] Check inbox at the `sales_rep_email` address
- [ ] Email should arrive within 1-2 minutes
- [ ] Verify subject line is correct
- [ ] Verify all tokens populated correctly (no blank fields)

### 6.3 Test SOW Approval Flow

**Access SOW:**
- [ ] Click link in email (or copy/paste URL)
- [ ] Should load `https://sow.sunvena.com/sow/{token}`
- [ ] Should show PIN entry form

**Verify PIN:**
- [ ] Enter 4-digit PIN from email
- [ ] Click "Verify"
- [ ] Should show SOW content (not error message)

**Verify Data Display:**
- [ ] Customer information section populated correctly
- [ ] Sales rep information matches project
- [ ] System details show correct values
- [ ] Financing information accurate
- [ ] Commission breakdown displays
- [ ] All adders shown (if any)
- [ ] Proposal image loads
- [ ] Plan file link works
- [ ] No "undefined" or "null" values visible

**Test Approval:**
- [ ] Click "Approve" button
- [ ] Confirm in modal
- [ ] Should show success message
- [ ] Page should update to show "Approved" status
- [ ] Green checkmark or approved badge visible

**Verify HubSpot Update (Approval):**
- [ ] Go back to HubSpot project
- [ ] Refresh the page
- [ ] Check `sow_status` property = `approved`
- [ ] Check `sow_approved_at` timestamp populated
- [ ] Check `sow_approved_by` shows correct email
- [ ] Check Activity tab for new Note
- [ ] Note should have PDF attachment
- [ ] Download PDF and verify contents

### 6.4 Test SOW Rejection Flow

**Reset Test Project:**
- [ ] In HubSpot, edit the project
- [ ] Clear `sow_token`, `sow_pin`, `sow_status`
- [ ] Clear `sow_approved_at`, `sow_approved_by`, `sow_rejection_reason`
- [ ] Set `send_rep_commission_sow` to `no`, then save
- [ ] Set `send_rep_commission_sow` to `yes`, then save (triggers webhook again)
- [ ] Wait for new email (workflow will enroll when token/PIN populated)

**Access and Reject:**
- [ ] Click new link from email
- [ ] Enter PIN
- [ ] Click "Reject" button
- [ ] Rejection modal should appear

**Enter Rejection Reason:**
- [ ] Type a detailed rejection reason (e.g., "Panel layout conflicts with roof vents. Please revise design.")
- [ ] Click "Submit Rejection"
- [ ] Should show success message
- [ ] Page should update to show "Rejected" status
- [ ] Red X or rejected badge visible

**Verify HubSpot Update (Rejection):**
- [ ] Go back to HubSpot project
- [ ] Refresh the page
- [ ] Check `sow_status` property = `rejected`
- [ ] Check `sow_rejected_at` timestamp populated
- [ ] Check `sow_rejection_reason` contains your reason text
- [ ] Check Activity tab for new Note
- [ ] Note should include rejection reason
- [ ] Note should have PDF attachment
- [ ] Download PDF and verify contents

### 6.5 Edge Case Testing

**Invalid PIN:**
- [ ] Access SOW link
- [ ] Enter wrong PIN (e.g., 0000)
- [ ] Should show "Invalid PIN" error
- [ ] Should not show SOW content

**Already Approved SOW:**
- [ ] Try accessing a SOW that was already approved
- [ ] Should show "Approved" state (not editable)
- [ ] Approve/Reject buttons should be disabled or hidden

**Long Rejection Reason:**
- [ ] Test with 2000 character rejection reason
- [ ] Should save successfully
- [ ] Verify full text appears in HubSpot note

**Rejection Reason Validation:**
- [ ] Try submitting blank rejection reason
- [ ] Should show validation error
- [ ] Try rejection reason over 2000 characters
- [ ] Should show "too long" error

**Token Edge Cases:**
- [ ] Try invalid token URL (e.g., /sow/invalid123)
- [ ] Should show "SOW not found" error
- [ ] Try accessing SOW from different browser/device
- [ ] Should work identically (no session issues)

---

## Phase 7: Go Live

### 7.1 Pre-Launch Checklist

- [ ] All Phase 6 tests passing
- [ ] DNS fully propagated (checked with multiple tools)
- [ ] SSL certificate valid (no browser warnings)
- [ ] At least 3 successful test approvals
- [ ] At least 3 successful test rejections
- [ ] PDF attachments working in HubSpot
- [ ] Email delivery working consistently
- [ ] Workflow error rate = 0%

### 7.2 Notify Stakeholders

**Sales Team:**
- [ ] Send announcement email about new SOW approval process
- [ ] Include example screenshots
- [ ] Explain: "You'll receive email with link + PIN"
- [ ] Set expectations: "Review and approve/reject within 24 hours"

**Design Team:**
- [ ] Notify when projects are approved (check HubSpot)
- [ ] Explain rejection reason workflow
- [ ] Set up notification for rejected projects

**Management:**
- [ ] Report system is live
- [ ] Share monitoring plan
- [ ] Establish escalation path for issues

### 7.3 Monitoring Setup

**Vercel Function Monitoring:**
- [ ] Vercel Dashboard → Project → Logs
- [ ] Set up Slack/email alerts for errors (if available)
- [ ] Monitor for 500 errors or timeouts
- [ ] Check daily for first week

**HubSpot Workflow Monitoring:**
- [ ] Workflows → SOW Review Request → History
- [ ] Check daily for failures
- [ ] Review error logs if enrollment fails
- [ ] Monitor email delivery rate

**Email Deliverability:**
- [ ] HubSpot → Email → Analyze
- [ ] Monitor bounce rate
- [ ] Check spam reports
- [ ] Verify open rates (should be high for action-required emails)

**Health Check Endpoint:**
- [ ] Bookmark: `https://sow.sunvena.com/api/health`
- [ ] Check weekly (or automate with uptime monitor)
- [ ] Verify all HubSpot integrations show "connected"

### 7.4 First Week Monitoring

**Daily checks (days 1-7):**
- [ ] Review Vercel error logs
- [ ] Check HubSpot workflow history
- [ ] Verify emails are sending
- [ ] Check for any support tickets

**Weekly checks (after first week):**
- [ ] Review aggregate metrics
- [ ] Check for patterns in errors
- [ ] Gather user feedback from sales team
- [ ] Optimize based on usage patterns

---

## Appendix: Troubleshooting Quick Reference

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Webhook not firing | Subscription not configured | Check Private App → Webhooks tab for `send_rep_commission_sow` subscription |
| Token/PIN not generated | Webhook endpoint error | Check Vercel logs for `/api/generate-sow` errors |
| Workflow not triggering | Enrollment criteria not met | Verify all 3 conditions: `send_rep_commission_sow`=yes, `sow_token` known, `sow_pin` known |
| Email not sending | Contact has no email permission | Check contact has marketing email consent in HubSpot |
| 404 on SOW link | Token not saved to project | Verify webhook successfully updated `sow_token` property |
| Invalid PIN | PIN not saved to project | Check `sow_pin` property has 4-digit value |
| SOW data not loading | API route error | Check Vercel function logs for errors |
| PDF generation timeout | Memory or time limits | Check Vercel function config (increase timeout if needed) |
| File upload fails | Missing HubSpot scopes | Verify `files` scope enabled on private app |
| DNS not resolving | CNAME record incorrect | Verify CNAME points to `cname.vercel-dns.com` |
| SSL certificate error | DNS not propagated | Wait 10-30 minutes, clear browser cache |
| Health check fails | Environment variable missing | Verify `HUBSPOT_ACCESS_TOKEN` set in Vercel |
| Properties not auto-created | API permissions issue | Check private app has `crm.schemas.projects.write` scope |
| Project API errors | Object type mismatch | Verify using object type `0-970` (Projects). See `docs/PROJECTS_API_REFERENCE.md` |

**Getting Help:**

1. **Vercel Issues:** [vercel.com/support](https://vercel.com/support)
2. **HubSpot Issues:** [support.hubspot.com](https://support.hubspot.com)
3. **DNS Issues:** Contact your DNS contractor
4. **Code Issues:** Contact project developer

---

## Contacts

- **HubSpot Support:** support.hubspot.com
- **Vercel Support:** vercel.com/support
- **DNS Contractor:** [Insert contact info]
- **Project Developer:** [Insert contact info]

---

*Checklist Version: 2.0*
*Last Updated: December 22, 2024*
