# HubSpot Projects API Reference (Beta)

**Source:** [Beta] Projects API .pdf (from HubSpot, not publicly documented)
**Status:** Beta API - subject to change
**Date Saved:** December 22, 2024

---

## Overview

The HubSpot Projects API is currently in beta and not yet documented in the public HubSpot developer documentation. This document preserves the API reference for the SOW Approval System integration.

**Critical:** The Projects object uses object type ID `0-970` in all API calls.

---

## API Scopes

Four scopes grant access to the Projects API:

| Scope | Permission | Purpose |
|-------|------------|---------|
| `crm.objects.projects.read` | Read | View properties and other details about projects |
| `crm.objects.projects.write` | Write | View properties and create, delete, or make changes to projects |
| `crm.schemas.projects.read` | Read | View details about property settings for projects |
| `crm.schemas.projects.write` | Write | Create, delete, or make changes to property settings for projects |

---

## CRUD and Search Operations

**Requires:** `crm.objects.projects.{read|write}`

The standard HubSpot Objects API works with Projects by using `0-970` as the `{objectType}` parameter.

**Reference:** https://developers.hubspot.com/docs/guides/crm/using-object-apis

### Create Project

```http
POST https://api.hubapi.com/crm/v3/objects/0-970

{
  "properties": {
    "hs_name": "Project created via API",
    "hs_pipeline": "139663aa-09ee-418e-b67d-c8cfcd3e5ce3",
    "hs_pipeline_stage": "c51bb66c-8141-44ef-82ec-703ae9c3a19f"
  }
}
```

### List All Projects (with specific properties)

```http
GET https://api.hubapi.com/crm/v3/objects/0-970?properties=hs_name,hs_target_due_date,hs_pipeline_stage
```

### Get Single Project

```http
GET https://api.hubapi.com/crm/v3/objects/0-970/{projectId}?properties=hs_name,hs_pipeline_stage
```

### Update Project

```http
PATCH https://api.hubapi.com/crm/v3/objects/0-970/{projectId}

{
  "properties": {
    "hs_name": "Updated project name"
  }
}
```

### Delete Project

```http
DELETE https://api.hubapi.com/crm/v3/objects/0-970/{projectId}
```

### Search Projects

```http
POST https://api.hubapi.com/crm/v3/objects/0-970/search

{
  "filterGroups": [{
    "filters": [{
      "propertyName": "sow_token",
      "operator": "EQ",
      "value": "12345-20241222"
    }]
  }],
  "properties": ["hs_name", "sow_token", "sow_pin", "sow_status"],
  "limit": 1
}
```

---

## Associations

**Requires:** `crm.objects.projects.{read|write}` and scope to any other needed object type

For engagements such as TASKS, no additional scopes are needed.

**References:**
- Associations v3: https://developers.hubspot.com/docs/api-reference/crm-associations-v3/guide
- Associations v3 Schema: https://developers.hubspot.com/docs/api-reference/crm-associations-schema-v3/types/get-crm-v3-associations-fromObjectType-toObjectType-types
- Associations v4: https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide

For `fromObjectType`/`toObjectType`, use object ID `0-970`.

### Association Types and IDs

| Association | Type ID |
|-------------|---------|
| PROJECT_TO_APPOINTMENT | 1324 |
| PROJECT_TO_CALL | 1257 |
| PROJECT_TO_COMMUNICATION (SMS, WhatsApp, LinkedIn) | 1281 |
| PROJECT_TO_COMPANY | 1236 |
| PROJECT_TO_COMPANY_PRIMARY | 1299 |
| PROJECT_TO_CONTACT | 1242 |
| PROJECT_TO_COURSE | 1322 |
| PROJECT_TO_DATA_SYNC_STATE | 1304 |
| **PROJECT_TO_DEAL** | **1238** |
| PROJECT_TO_EMAIL | 1259 |
| PROJECT_TO_LISTING | 1320 |
| PROJECT_TO_MEETING_EVENT | 1255 |
| PROJECT_TO_NOTE | 1248 |
| PROJECT_TO_POSTAL_MAIL | 1263 |
| PROJECT_TO_PROJECT | 1254 |
| PROJECT_TO_SERVICE | 1244 |
| PROJECT_TO_TASK | 1246 |
| PROJECT_TO_TICKET | 1240 |

### Reverse Associations

| Association | Type ID |
|-------------|---------|
| APPOINTMENT_TO_PROJECT | 1325 |
| CALL_TO_PROJECT | 1258 |
| COMMUNICATION_TO_PROJECT | 1282 |
| COMPANY_TO_PROJECT | 1237 |
| COMPANY_TO_PROJECT_PRIMARY | 1300 |
| CONTACT_TO_PROJECT | 1243 |
| COURSE_TO_PROJECT | 1323 |
| DATA_SYNC_STATE_TO_PROJECT | 1303 |
| **DEAL_TO_PROJECT** | **1239** |
| EMAIL_TO_PROJECT | 1260 |
| LISTING_TO_PROJECT | 1321 |
| MEETING_EVENT_TO_PROJECT | 1256 |
| NOTE_TO_PROJECT | 1249 |
| POSTAL_MAIL_TO_PROJECT | 1264 |
| SERVICE_TO_PROJECT | 1245 |
| TASK_TO_PROJECT | 1247 |
| TICKET_TO_PROJECT | 1241 |

### Association Examples

**Associate Task to Project:**
```http
PUT https://api.hubspot.com/crm/v4/objects/0-970/{projectId}/associations/default/0-27/{taskId}
```

**List all associated Tasks:**
```http
GET https://api.hubspot.com/crm/v4/objects/0-970/{projectId}/associations/0-27
```

**Associate Project to Deal:**
```http
PUT https://api.hubspot.com/crm/v4/objects/0-970/{projectId}/associations/default/deals/{dealId}
```

---

## Properties

**Requires:** `crm.schemas.projects.{read|write}`

The Properties API can be used for CRUD operations with properties.

**Reference:** https://developers.hubspot.com/docs/api-reference/crm-properties-v3/guide

Use `0-970` as the `{objectType}` parameter.

### Read All Properties

```http
GET https://api.hubapi.com/crm/v3/properties/0-970
```

### Create Property

```http
POST https://api.hubapi.com/crm/v3/properties/0-970

{
  "name": "sow_token",
  "label": "SOW Token",
  "type": "string",
  "fieldType": "text",
  "groupName": "sow_approval",
  "description": "Unique token used in SOW approval URL",
  "hasUniqueValue": true
}
```

### Create Property Group

```http
POST https://api.hubapi.com/crm/v3/properties/0-970/groups

{
  "name": "sow_approval",
  "label": "SOW Approval",
  "displayOrder": 1
}
```

---

## Pipelines

**Requires:** `crm.schemas.projects.{read|write}`, `crm.objects.projects.{read|write}`

The Pipelines API can be used to retrieve or create pipelines and stages.

**Reference:** https://developers.hubspot.com/docs/api-reference/crm-pipelines-v3/guide

Use `0-970` as the `{objectType}` parameter.

### Retrieve All Pipelines

```http
GET https://api.hubapi.com/crm/v3/pipelines/0-970
```

---

## Default Project Properties

Projects have these built-in properties:

| Property | Type | Description |
|----------|------|-------------|
| `hs_name` | string | Project name (equivalent to `dealname` on deals) |
| `hs_pipeline` | string | Pipeline ID |
| `hs_pipeline_stage` | string | Pipeline stage ID |
| `hs_target_due_date` | datetime | Target due date |

---

## Migration Notes: Deals to Projects

### API Endpoint Changes

| Operation | Old (Deals) | New (Projects) |
|-----------|-------------|----------------|
| CRUD | `/crm/v3/objects/deals` | `/crm/v3/objects/0-970` |
| Search | `/crm/v3/objects/deals/search` | `/crm/v3/objects/0-970/search` |
| Properties | `/crm/v3/properties/deals` | `/crm/v3/properties/0-970` |
| Property Groups | `/crm/v3/properties/deals/groups` | `/crm/v3/properties/0-970/groups` |
| Pipelines | `/crm/v3/pipelines/deals` | `/crm/v3/pipelines/0-970` |

### Scope Changes

| Old Scope | New Scope |
|-----------|-----------|
| `crm.objects.deals.read` | `crm.objects.projects.read` |
| `crm.objects.deals.write` | `crm.objects.projects.write` |
| `crm.schemas.deals.read` | `crm.schemas.projects.read` |
| `crm.schemas.deals.write` | `crm.schemas.projects.write` |

### Property Naming

- `dealname` on deals → `hs_name` on projects (or custom `project_name`)
- Custom properties can use same names (e.g., `sow_token`, `sow_pin`)

---

## Important Notes

1. **Beta Status:** This API is in beta and may change without notice
2. **Object Type ID:** Always use `0-970` as the object type identifier
3. **Not in Public Docs:** This API is not yet documented on developers.hubspot.com
4. **Association to Deals:** Projects can be associated with Deals using type ID 1238/1239
5. **Property Migration:** Custom properties need to be created on the Projects object, not Deals

---

*Document saved for reference. Original source: HubSpot internal documentation provided via PDF.*
