# DNS Contractor Email Template

Use this email template to request DNS configuration from the contractor managing sunvena.com.

---

## Email Template

**To:** [DNS Contractor Email]

**Cc:** [Your Manager / IT Lead]

**Subject:** DNS Configuration Request - sow.sunvena.com Subdomain for SOW Approval System

---

Hi [Contractor Name],

We're deploying a new SOW (Scope of Work) approval application for our sales team. The application is hosted on Vercel and needs a custom subdomain configured.

## Requested DNS Changes

Please add the following DNS records to the `sunvena.com` domain:

### 1. CNAME Record (Required)

| Field | Value |
|-------|-------|
| **Type** | CNAME |
| **Name/Host** | `sow` |
| **Value/Points To** | `cname.vercel-dns.com` |
| **TTL** | 3600 (or automatic) |

> **Important:** In the Name/Host field, enter only `sow` — not the full `sow.sunvena.com`. Most DNS providers automatically append the root domain.

### 2. TXT Verification Record (If Required)

*[Include this section ONLY if Vercel shows a verification record in the dashboard]*

| Field | Value |
|-------|-------|
| **Type** | TXT |
| **Name/Host** | `_vercel` |
| **Value** | `[PASTE VERIFICATION TOKEN FROM VERCEL HERE]` |
| **TTL** | 3600 (or automatic) |

### 3. CAA Record (If sunvena.com has existing CAA records)

*[Include this section ONLY if sunvena.com already has CAA records configured]*

Please ensure Let's Encrypt is allowed to issue certificates:

| Field | Value |
|-------|-------|
| **Type** | CAA |
| **Name/Host** | `@` (or `sunvena.com`) |
| **Value** | `0 issue "letsencrypt.org"` |
| **TTL** | 3600 (or automatic) |

---

## Pre-Configuration Checklist

Before adding the new records, please:

1. **Remove** any existing A records for `sow.sunvena.com`
2. **Remove** any existing CNAME records for `sow.sunvena.com`
3. Ensure no duplicate or conflicting records exist

## Cloudflare Users (If Applicable)

If you're using Cloudflare:

- Set the CNAME record to **"DNS only"** mode (gray cloud icon)
- Do **NOT** use "Proxied" mode (orange cloud)
- Proxied mode interferes with Vercel's SSL certificate generation

---

## Verification

After making the changes, you can verify with these commands:

```bash
# Check CNAME record
dig CNAME +short sow.sunvena.com
# Expected output: cname.vercel-dns.com

# Check TXT record (if added)
dig TXT +short _vercel.sunvena.com
```

Or use online tools:
- https://dnschecker.org
- https://whatsmydns.net

---

## Timeline

DNS changes typically propagate within **1-2 hours**, but can take up to 24-48 hours in some cases.

Please confirm once the changes are live so we can verify on our end.

---

## Questions?

If you need any clarification or run into issues, please reach out:

- **Technical Contact:** [Your Name] - [Your Email]
- **Phone:** [Your Phone Number]

Thank you for your help with this setup!

Best regards,
[Your Name]
[Your Title]
Sunvena Solar

---

## After Sending: Follow-Up Checklist

- [ ] Email sent to DNS contractor
- [ ] CC'd relevant stakeholders
- [ ] Set calendar reminder to follow up in 24 hours if no response
- [ ] Monitor Vercel dashboard for "Valid Configuration" status
- [ ] Test `https://sow.sunvena.com` once DNS propagates

---

## Troubleshooting Reference

If the contractor reports issues:

| Issue | Solution |
|-------|----------|
| "Record already exists" | Ask them to delete existing record first |
| "Invalid record value" | Double-check they're using `cname.vercel-dns.com` (exact spelling) |
| "CNAME conflicts with A record" | Remove A record before adding CNAME |
| "Cannot add CNAME at root" | Remind them this is a subdomain (`sow`), not root |
| "Cloudflare proxy issues" | Switch to DNS-only mode (gray cloud) |

---

*Template Version: 1.0*
*Last Updated: December 22, 2024*
