/**
 * HubSpot Files API Client
 * ========================
 *
 * Provides methods for uploading files and creating notes with attachments
 * for the SOW Approval System.
 *
 * Usage:
 *   import { uploadFileToHubSpot, createNoteWithAttachment } from '@/lib/hubspot-files';
 *
 *   const fileId = await uploadFileToHubSpot(pdfBuffer, 'SOW.pdf', '/SOW-Approvals');
 *   await createNoteWithAttachment(dealId, 'SOW Approved', fileId);
 *
 * Required Environment Variables:
 *   - HUBSPOT_ACCESS_TOKEN: Private app access token with 'files' scope
 *
 * @see https://developers.hubspot.com/docs/api-reference/files-files-v3/guide
 * @see https://developers.hubspot.com/docs/api-reference/crm-notes-v3/guide
 */

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * File access levels in HubSpot.
 *
 * - PUBLIC_INDEXABLE: Accessible by anyone, indexed by search engines
 * - PUBLIC_NOT_INDEXABLE: Accessible by anyone, not indexed
 * - PRIVATE: Only accessible by authenticated users
 */
export type FileAccess = 'PUBLIC_INDEXABLE' | 'PUBLIC_NOT_INDEXABLE' | 'PRIVATE';

/**
 * Options for file upload.
 */
export interface UploadOptions {
  access?: FileAccess;
  folderPath?: string;
  folderId?: string;
}

/**
 * Upload a file to HubSpot's file manager.
 *
 * @param fileBuffer - The file content as a Buffer
 * @param fileName - The name to give the file in HubSpot
 * @param folderPath - Optional folder path (e.g., '/SOW-Approvals')
 * @param access - File access level, defaults to 'PRIVATE'
 * @returns The HubSpot file ID
 */
export async function uploadFileToHubSpot(
  fileBuffer: Buffer,
  fileName: string,
  folderPath?: string,
  access: FileAccess = 'PRIVATE'
): Promise<string> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is required');
  }

  // Create form data for multipart upload
  const formData = new FormData();

  // Add the file
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
  formData.append('file', blob, fileName);

  // Add options
  const options: Record<string, unknown> = { access };
  formData.append('options', JSON.stringify(options));

  // Add folder path if specified
  if (folderPath) {
    formData.append('folderPath', folderPath);
  }

  // Upload the file
  const uploadResponse = await fetch(`${HUBSPOT_API_BASE}/files/v3/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      // Note: Don't set Content-Type for FormData - browser sets it with boundary
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`File upload failed: ${uploadResponse.status} - ${error}`);
  }

  const uploadResult = await uploadResponse.json() as { id: string };
  const fileId = uploadResult.id;

  // Workaround: HubSpot has a known bug where access level isn't always applied
  // on initial upload. We patch it explicitly to ensure privacy.
  if (access === 'PRIVATE') {
    await setFileAccess(fileId, 'PRIVATE');
  }

  return fileId;
}

/**
 * Update the access level of an existing file.
 *
 * @param fileId - The HubSpot file ID
 * @param access - The new access level
 */
export async function setFileAccess(
  fileId: string,
  access: FileAccess
): Promise<void> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is required');
  }

  const response = await fetch(`${HUBSPOT_API_BASE}/files/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to set file access: ${response.status} - ${error}`);
  }
}

/**
 * Association type IDs for HubSpot CRM.
 * @see https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide
 */
const ASSOCIATION_TYPE_IDS = {
  DEAL_TO_NOTE: 213,
  NOTE_TO_DEAL: 214,
  CONTACT_TO_NOTE: 201,
  NOTE_TO_CONTACT: 202,
  COMPANY_TO_NOTE: 189,
  NOTE_TO_COMPANY: 190,
};

/**
 * Create a note and associate it with a deal, optionally with file attachments.
 *
 * @param dealId - The HubSpot deal ID to associate the note with
 * @param noteBody - The text content of the note
 * @param fileIds - Optional file ID(s) to attach (single ID or array)
 * @returns The created note ID
 */
export async function createNoteWithAttachment(
  dealId: string,
  noteBody: string,
  fileIds?: string | string[]
): Promise<string> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is required');
  }

  // Format file IDs as semicolon-separated string
  let attachmentIds: string | undefined;
  if (fileIds) {
    attachmentIds = Array.isArray(fileIds) ? fileIds.join(';') : fileIds;
  }

  // Build note properties
  const properties: Record<string, string> = {
    hs_timestamp: new Date().toISOString(),
    hs_note_body: noteBody,
  };

  if (attachmentIds) {
    properties.hs_attachment_ids = attachmentIds;
  }

  // Create the note with association to deal
  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties,
      associations: [
        {
          to: { id: dealId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: ASSOCIATION_TYPE_IDS.DEAL_TO_NOTE,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Note creation failed: ${response.status} - ${error}`);
  }

  const result = await response.json() as { id: string };
  return result.id;
}

/**
 * Create a formatted approval note for the deal timeline.
 *
 * @param dealId - The deal ID
 * @param approverEmail - Email of the person who approved
 * @param pdfFileId - File ID of the approval PDF
 */
export async function createApprovalNote(
  dealId: string,
  approverEmail: string,
  pdfFileId: string
): Promise<string> {
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York', // Adjust timezone as needed
  });

  const noteBody = `✅ SOW APPROVED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVAL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Approved by: ${approverEmail.toUpperCase()}
Approved at: ${timestamp}

The signed SOW document is attached to this note.`;

  return createNoteWithAttachment(dealId, noteBody, pdfFileId);
}

/**
 * Create a formatted rejection note for the deal timeline.
 *
 * @param dealId - The deal ID
 * @param rejecterEmail - Email of the person who rejected
 * @param reason - Rejection reason provided by the user
 * @param pdfFileId - File ID of the rejection PDF
 */
export async function createRejectionNote(
  dealId: string,
  rejecterEmail: string,
  reason: string,
  pdfFileId: string
): Promise<string> {
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York', // Adjust timezone as needed
  });

  const noteBody = `❌ SOW REJECTED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REJECTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rejected by: ${rejecterEmail.toUpperCase()}
Rejected at: ${timestamp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REJECTION REASON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${reason}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The SOW document at time of rejection is attached to this note.
Please address the concerns and resubmit for review.`;

  return createNoteWithAttachment(dealId, noteBody, pdfFileId);
}

/**
 * Get the public URL for a HubSpot file.
 *
 * @param fileId - The HubSpot file ID
 * @returns The public URL if available
 */
export async function getFileUrl(fileId: string): Promise<string | null> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is required');
  }

  const response = await fetch(
    `${HUBSPOT_API_BASE}/files/v3/files/${fileId}?properties=url`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const result = await response.json() as { url?: string };
  return result.url || null;
}
