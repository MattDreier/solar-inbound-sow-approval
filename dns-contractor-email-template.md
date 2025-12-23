# DNS Configuration Email Template

## Quick-Send Template for DNS Contractor

---

**Subject:** DNS Configuration Request - sow.sunvena.com Subdomain

---

Hi [Contractor Name],

We need to configure a subdomain for our SOW approval application hosted on Vercel.

**Please add the following DNS records to sunvena.com:**

### 1. CNAME Record (Required)
```
Type: CNAME
Name/Host: sow
Value: cname.vercel-dns.com
TTL: 3600 (or automatic)
```

### 2. TXT Verification Record (Include only if Vercel requires it)
```
Type: TXT
Name/Host: _vercel
Value: [INSERT VERIFICATION TOKEN FROM VERCEL DASHBOARD]
TTL: 3600 (or automatic)
```

### 3. CAA Record (Include only if sunvena.com already has CAA records)
```
Type: CAA
Name/Host: @ (or sunvena.com)
Value: 0 issue "letsencrypt.org"
TTL: 3600 (or automatic)
```

---

### Important Notes:

1. **Name field format:**
   - For the CNAME record, enter ONLY `sow` (not `sow.sunvena.com`)
   - Most DNS providers automatically append the root domain

2. **Remove conflicting records:**
   - Delete any existing A records for the `sow` subdomain
   - Delete any existing CNAME records for the `sow` subdomain

3. **Cloudflare users:**
   - If using Cloudflare, set the CNAME record to **DNS only** (gray cloud icon)
   - Do NOT use **Proxied** (orange cloud icon)

4. **Propagation time:**
   - DNS changes typically propagate within 1-2 hours
   - Maximum propagation time is 48 hours

---

### Verification:

Once complete, please verify the CNAME record using:

```bash
dig CNAME +short sow.sunvena.com
```

**Expected result:** `cname.vercel-dns.com`

Alternatively, you can use online tools:
- https://dnschecker.org
- https://whatsmydns.net

---

Please confirm once the changes are live. Let me know if you need any clarification.

Thanks,
[Your Name]

---

## Alternative Version: Minimal Template

For contractors who prefer concise instructions:

---

**Subject:** Add DNS Record - sow.sunvena.com

Hi [Name],

Please add this DNS record to sunvena.com:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | sow | cname.vercel-dns.com | Auto |

Remove any existing A or CNAME records for "sow" subdomain.

If using Cloudflare, set to DNS-only (gray cloud).

Verify after propagation:
```
dig CNAME +short sow.sunvena.com
```

Expected: `cname.vercel-dns.com`

Thanks!

---

## Pre-Send Checklist

Before sending this email, ensure you have:

- [ ] Logged into Vercel dashboard
- [ ] Added `sow.sunvena.com` to your Vercel project (Settings → Domains)
- [ ] Copied the exact CNAME value from Vercel (usually `cname.vercel-dns.com`)
- [ ] Copied the TXT verification token (if shown in Vercel)
- [ ] Checked if sunvena.com has existing CAA records (run `dig CAA +short sunvena.com`)
- [ ] Updated the contractor's name and your signature in the template

---

## Post-Configuration Follow-Up

Once the contractor confirms DNS is updated, send:

---

**Subject:** Re: DNS Configuration Request - sow.sunvena.com Subdomain

Hi [Contractor Name],

Thanks for updating the DNS records.

I can confirm that:
- [ ] DNS has propagated successfully
- [ ] Vercel shows "Valid Configuration"
- [ ] SSL certificate has been issued
- [ ] https://sow.sunvena.com is accessible

[OR, if there are issues:]

I'm seeing [describe issue]. Could you please verify:
1. The CNAME record points to `cname.vercel-dns.com`
2. No A records exist for the `sow` subdomain
3. [Any other specific checks needed]

Thanks,
[Your Name]

---

## Troubleshooting Email Template

If DNS isn't working after 24 hours:

---

**Subject:** DNS Issue Follow-Up - sow.sunvena.com

Hi [Contractor Name],

I'm still seeing DNS resolution issues for sow.sunvena.com after 24 hours.

Could you please verify the following:

1. **CNAME Record Check:**
   ```
   Type: CNAME
   Name: sow
   Value: cname.vercel-dns.com
   ```
   - Ensure the Name field is ONLY `sow` (not `sow.sunvena.com`)

2. **No Conflicting Records:**
   - Remove any A records for `sow` subdomain
   - Remove any other CNAME records for `sow` subdomain

3. **DNS Provider:**
   - Which DNS provider/panel are you using? (GoDaddy, Cloudflare, Namecheap, etc.)

4. **Screenshot:**
   - Can you send a screenshot of the DNS record in your panel?

Current status from my end:
```
dig CNAME +short sow.sunvena.com
[paste output or "no results"]
```

Thanks for your help troubleshooting this.

[Your Name]

---

## Quick Reference: Information to Provide

When contacting the DNS contractor, have ready:

1. **Domain to configure:** `sow.sunvena.com`
2. **CNAME target:** `cname.vercel-dns.com`
3. **TXT verification (if needed):**
   - Name: `_vercel`
   - Value: [from Vercel dashboard]
4. **Vercel project URL:** [your-project].vercel.app
5. **Expected completion:** 1-2 hours (max 48 hours)

---

*Template Version: 1.0*
*Created: 2024-12-22*
