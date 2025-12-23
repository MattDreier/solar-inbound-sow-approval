# Vercel Custom Subdomain Setup Guide
## Domain: sow.sunvena.com

This document provides step-by-step instructions for setting up the custom subdomain `sow.sunvena.com` to point to a Vercel-hosted application.

---

## Overview

**Target Domain:** `sow.sunvena.com`
**URL Pattern:** `sow.sunvena.com/{dealId-needs_review_date}`
**Hosting Platform:** Vercel
**SSL Certificate:** Automatically provided by Vercel via Let's Encrypt
**DNS Record Type:** CNAME (subdomain configuration)

---

## 1. Vercel Custom Domain Setup Process

### 1.1 Add Domain in Vercel Project

**Vercel Project Owner Must:**

1. Log into Vercel dashboard
2. Navigate to the project for the SOW Approval System
3. Go to **Settings → Domains**
4. Click **Add Domain**
5. Enter: `sow.sunvena.com`
6. Click **Add**

Vercel will provide:
- A **CNAME target value** (typically `cname.vercel-dns.com`)
- A **TXT verification record** (if domain ownership verification is required)
- **Domain status** showing "Invalid Configuration" until DNS is updated

### 1.2 DNS Records Required

Vercel will display the exact DNS records needed. Typically for a subdomain:

| Record Type | Name/Host | Value/Points To | TTL |
|-------------|-----------|-----------------|-----|
| CNAME | `sow` | `cname.vercel-dns.com` | 3600 (or Auto) |
| TXT (optional) | `_vercel` | `vc-domain-verify=sow.sunvena.com,[verification-token]` | 3600 (or Auto) |

**Note:** The exact CNAME value will be shown in the Vercel dashboard after adding the domain.

### 1.3 SSL Certificate Handling

**Automatic Process:**
- Vercel automatically provisions SSL certificates via Let's Encrypt
- Certificate generation begins once DNS records are correctly configured
- No manual SSL setup required
- Certificates auto-renew every 90 days

**CAA Record Requirement (if applicable):**
If the root domain `sunvena.com` has existing CAA records, add:

| Record Type | Name/Host | Value |
|-------------|-----------|-------|
| CAA | `@` or `sunvena.com` | `0 issue "letsencrypt.org"` |

This allows Let's Encrypt to issue certificates for the domain.

---

## 2. What the Domain Owner (sunvena.com) Needs to Do

**DNS Provider:** The contractor managing `sunvena.com` DNS

### Required Actions:

#### Step 1: Add CNAME Record

Access your DNS management panel (GoDaddy, Cloudflare, Namecheap, etc.) and add:

```
Type: CNAME
Name/Host: sow
Value/Points To: cname.vercel-dns.com
TTL: 3600 (or leave as automatic)
```

**Important Notes:**
- **Name field:** Enter ONLY `sow` (not `sow.sunvena.com`)
- **Do NOT include the root domain** in the Name/Host field
- Most DNS providers auto-append the root domain

#### Step 2: Add TXT Record (if requested by Vercel)

If Vercel requires domain verification:

```
Type: TXT
Name/Host: _vercel
Value: [Verification token provided by Vercel project owner]
TTL: 3600 (or leave as automatic)
```

#### Step 3: Check for Conflicting Records

Before saving:
- **Remove** any existing `A` records for the `sow` subdomain
- **Remove** any existing `CNAME` records for the `sow` subdomain
- Ensure no duplicate records exist

#### Step 4: Special Considerations for Cloudflare Users

If using Cloudflare:
- Set the CNAME record to **DNS only** (gray cloud icon)
- Do NOT use **Proxied** (orange cloud icon)
- Proxied mode can interfere with Vercel's SSL certificate generation

### Verification Commands

After adding DNS records, verify with these commands:

```bash
# Check CNAME record
dig CNAME +short sow.sunvena.com

# Expected output: cname.vercel-dns.com

# Check TXT record (if applicable)
dig TXT +short _vercel.sunvena.com
```

Or use online tools:
- [DNS Checker](https://dnschecker.org)
- [WhatsMyDNS](https://whatsmydns.net)

---

## 3. What the Vercel Project Owner Needs to Provide

**Information to send to DNS contractor:**

1. **Domain to configure:** `sow.sunvena.com`
2. **CNAME target:** `cname.vercel-dns.com` (confirm from Vercel dashboard)
3. **TXT verification record** (if shown in Vercel):
   - Name: `_vercel`
   - Value: `[copy exact token from Vercel]`
4. **CAA record requirement** (if sunvena.com has existing CAA records):
   - Value: `0 issue "letsencrypt.org"`

**Template Email for DNS Contractor:**

```
Subject: DNS Configuration Request - sow.sunvena.com Subdomain

Hi [Contractor Name],

We need to configure a subdomain for our SOW approval application hosted on Vercel.

Please add the following DNS records to sunvena.com:

1. CNAME Record:
   - Type: CNAME
   - Name/Host: sow
   - Value: cname.vercel-dns.com
   - TTL: 3600 (or automatic)

[OPTIONAL - Include only if Vercel shows a TXT verification record]
2. TXT Verification Record:
   - Type: TXT
   - Name/Host: _vercel
   - Value: [INSERT VERIFICATION TOKEN FROM VERCEL]
   - TTL: 3600 (or automatic)

[OPTIONAL - Include only if sunvena.com has existing CAA records]
3. CAA Record (if not already present):
   - Type: CAA
   - Name/Host: @ (or sunvena.com)
   - Value: 0 issue "letsencrypt.org"
   - TTL: 3600 (or automatic)

Important Notes:
- Remove any existing A or CNAME records for the "sow" subdomain
- If using Cloudflare, set the CNAME to "DNS only" (gray cloud), not "Proxied"
- DNS changes typically propagate within 1-2 hours but can take up to 48 hours

Please confirm once the changes are live. You can verify using:
dig CNAME +short sow.sunvena.com

Expected result: cname.vercel-dns.com

Let me know if you need any clarification.

Thanks,
[Your Name]
```

---

## 4. DNS Propagation Timeline

### Expected Timeframes:

| Change Type | Typical Propagation | Maximum |
|-------------|---------------------|---------|
| CNAME records | 5 minutes - 2 hours | 24 hours |
| TXT records | 5 minutes - 2 hours | 24 hours |
| Nameserver changes | 4-8 hours | 48 hours |

### Verification Steps:

1. **Immediately after DNS changes:**
   - Check with `dig` command or DNS checker tools
   - Vercel dashboard will show "Valid Configuration" when DNS propagates

2. **SSL Certificate Generation:**
   - Begins automatically once DNS is verified
   - Usually completes within 5-10 minutes
   - Vercel dashboard will show certificate status

3. **Full Deployment:**
   - Domain becomes accessible via HTTPS
   - Vercel automatically redirects HTTP to HTTPS

---

## 5. Common Issues and Troubleshooting

### Issue 1: "Invalid Configuration" in Vercel

**Symptoms:**
- Vercel dashboard shows domain as "Invalid Configuration"
- Domain doesn't resolve

**Solutions:**
1. Verify CNAME record exists: `dig CNAME +short sow.sunvena.com`
2. Check for typos in DNS record values
3. Ensure no conflicting A records exist
4. Wait for DNS propagation (up to 24 hours)
5. Clear local DNS cache:
   - Mac: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - Windows: `ipconfig /flushdns`
   - Linux: `sudo systemd-resolve --flush-caches`

### Issue 2: SSL Certificate Not Generating

**Symptoms:**
- Domain resolves but shows SSL/TLS error
- "Certificate not issued" in Vercel

**Solutions:**
1. **Check CAA records:** If `sunvena.com` has CAA records, ensure Let's Encrypt is allowed:
   ```bash
   dig CAA +short sunvena.com
   ```
   Must include: `0 issue "letsencrypt.org"`

2. **Verify DNS resolution:** Ensure CNAME points to `cname.vercel-dns.com`

3. **Check Cloudflare proxy:** If using Cloudflare, disable proxy (gray cloud)

4. **Re-verify domain in Vercel:**
   - Go to Settings → Domains
   - Click "Refresh" or "Re-verify" next to the domain

### Issue 3: DNS Changes Not Propagating

**Symptoms:**
- Hours have passed but DNS still shows old values
- `dig` shows no records or old records

**Solutions:**
1. **Check authoritative nameservers:**
   ```bash
   dig NS +short sunvena.com
   ```
   Ensure you're updating DNS at the correct provider

2. **Verify with multiple DNS checkers:**
   - [DNS Checker](https://dnschecker.org) - Global propagation status
   - [WhatsMyDNS](https://whatsmydns.net) - Check multiple regions

3. **Contact DNS provider:**
   - Some providers have longer propagation delays
   - Check for service status issues

### Issue 4: Domain Verification Failure

**Symptoms:**
- Vercel asks for domain ownership verification
- TXT record verification fails

**Solutions:**
1. **Double-check TXT record:**
   ```bash
   dig TXT +short _vercel.sunvena.com
   ```
   Must match exact token from Vercel

2. **Wait for TXT propagation:** TXT records can take longer (up to 24 hours)

3. **Remove old TXT records:** Ensure no duplicate verification records exist

### Issue 5: Cloudflare Conflicts

**Symptoms:**
- Domain configured but SSL errors persist
- Mixed content warnings

**Solutions:**
1. **Set CNAME to DNS-only mode:**
   - Log into Cloudflare
   - Find the `sow` CNAME record
   - Click the orange cloud to make it gray (DNS only)

2. **Disable Cloudflare SSL:**
   - Go to SSL/TLS settings
   - Set to "Full" or "Full (strict)" mode

3. **Clear Cloudflare cache:**
   - Purge Everything in Cloudflare dashboard

---

## 6. Post-Setup Verification Checklist

Once DNS is configured, verify:

- [ ] `dig CNAME +short sow.sunvena.com` returns `cname.vercel-dns.com`
- [ ] Vercel dashboard shows "Valid Configuration"
- [ ] Vercel dashboard shows SSL certificate is issued
- [ ] `https://sow.sunvena.com` loads without SSL errors
- [ ] `http://sow.sunvena.com` redirects to HTTPS
- [ ] Test URL: `https://sow.sunvena.com/demo-token-abc123xyz789` works

---

## 7. Technical Reference

### Vercel Infrastructure Details

- **CNAME Target:** `cname.vercel-dns.com` (standard for all Vercel projects)
- **SSL Provider:** Let's Encrypt (automatic)
- **Certificate Type:** RSA 2048-bit or ECDSA P-256
- **Certificate Renewal:** Automatic every 90 days
- **HTTP/2 Support:** Yes (automatic)
- **IPv6 Support:** Yes (automatic)

### Alternative Configuration Methods

**If CNAME is not an option** (rare scenarios):

Vercel provides an A record IP address in the domain settings. Use this ONLY if:
- DNS provider doesn't support CNAME for subdomains
- Special network requirements exist

**Note:** CNAME is the recommended method for subdomains.

---

## 8. Support Contacts

### Vercel Support
- Documentation: https://vercel.com/docs/domains
- Community: https://community.vercel.com
- Support: support@vercel.com (for paid plans)

### DNS Troubleshooting Tools
- DNS Propagation: https://dnschecker.org
- Global DNS Status: https://whatsmydns.net
- DNS Record Checker: https://mxtoolbox.com/DNSLookup.aspx

---

## 9. Security Considerations

### HTTPS Enforcement
- Vercel automatically redirects all HTTP traffic to HTTPS
- No additional configuration required

### HSTS (HTTP Strict Transport Security)
- Consider adding HSTS header in Vercel configuration
- Prevents downgrade attacks

### Domain Ownership Verification
- Keep TXT verification records in DNS for future re-verification
- Do not delete `_vercel` TXT record unless instructed by Vercel

---

## Summary for Quick Reference

**For DNS Contractor:**
1. Add CNAME: `sow` → `cname.vercel-dns.com`
2. Add TXT (if needed): `_vercel` → `[token from Vercel]`
3. Remove conflicting records
4. Set Cloudflare to DNS-only (if applicable)

**Expected Timeline:**
- DNS propagation: 1-2 hours (max 24 hours)
- SSL certificate: 5-10 minutes after DNS propagates
- Total time: Usually under 2 hours

**Verification:**
- Run: `dig CNAME +short sow.sunvena.com`
- Expected: `cname.vercel-dns.com`
- Test: `https://sow.sunvena.com`

---

## Sources

- [Vercel - Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Vercel - Managing DNS Records](https://vercel.com/docs/domains/managing-dns-records)
- [Vercel - Working with SSL Certificates](https://vercel.com/docs/domains/working-with-ssl)
- [Vercel KB - How to Add a Custom Domain](https://vercel.com/kb/guide/how-do-i-add-a-custom-domain-to-my-vercel-project)
- [Vercel - DNS Propagation Guide](https://vercel.com/guides/how-long-to-update-dns-records)
- [Vercel - Troubleshooting Domains](https://vercel.com/docs/domains/troubleshooting)
- [DEV Community - Setting up a Domain and Subdomain on Vercel](https://dev.to/farhadjaman/setting-up-a-domain-and-subdomain-on-vercel-a-step-by-step-guide-2idg)
- [Vercel - Can I use my domain with A records?](https://vercel.com/kb/guide/a-record-and-caa-with-vercel)
- [Vercel - Why is my domain not generating SSL certificate?](https://vercel.com/guides/domain-not-generating-ssl-certificate)
- [Vercel Platforms - Configuring Custom Domains](https://vercel.com/platforms/docs/multi-tenant-platforms/configuring-domains)

---

*Document Created: 2024-12-22*
*Last Updated: 2024-12-22*
*Version: 1.0*
