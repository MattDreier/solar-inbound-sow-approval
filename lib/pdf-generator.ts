/**
 * PDF Generator
 * =============
 *
 * Generates PDF snapshots of SOW pages using Puppeteer with @sparticuz/chromium.
 * Optimized for Vercel serverless deployment.
 *
 * Usage:
 *   import { generatePDF } from '@/lib/pdf-generator';
 *   const pdfBuffer = await generatePDF('12345-20241222');
 *
 * Required Dependencies:
 *   npm install puppeteer-core @sparticuz/chromium-min
 *   npm install --save-dev puppeteer  # For local development
 *
 * Required Environment Variables:
 *   - NEXT_PUBLIC_BASE_URL: Base URL of the application
 *
 * Vercel Configuration (vercel.json):
 *   {
 *     "functions": {
 *       "app/api/approve-sow/route.ts": { "maxDuration": 60, "memory": 1024 },
 *       "app/api/reject-sow/route.ts": { "maxDuration": 60, "memory": 1024 }
 *     }
 *   }
 *
 * @see https://vercel.com/guides/using-puppeteer-with-vercel
 */

import chromium from '@sparticuz/chromium-min';
import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer-core';

/**
 * PDF generation options.
 */
export interface PDFGenerationOptions {
  /** Paper format. Default: 'A4' */
  format?: 'A4' | 'Letter' | 'Legal';
  /** Print background graphics. Default: true */
  printBackground?: boolean;
  /** Margin in CSS units. Default: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' } */
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** Additional wait time after page load in ms. Default: 0 */
  additionalWaitMs?: number;
  /** Viewport width. Default: 1200 */
  viewportWidth?: number;
  /** Viewport height. Default: 800 */
  viewportHeight?: number;
}

/**
 * Default PDF generation options.
 */
const DEFAULT_OPTIONS: Required<PDFGenerationOptions> = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '1cm',
    right: '1cm',
    bottom: '1cm',
    left: '1cm',
  },
  additionalWaitMs: 0,
  viewportWidth: 1200,
  viewportHeight: 800,
};

/**
 * Get the Chrome executable path based on environment.
 */
async function getExecutablePath(): Promise<string> {
  if (process.env.VERCEL) {
    // Production: Use @sparticuz/chromium-min
    return chromium.executablePath(
      '/opt/nodejs/node_modules/@sparticuz/chromium-min/bin'
    );
  }

  // Local development: Use installed Chrome
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (process.platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else {
    return '/usr/bin/google-chrome';
  }
}

/**
 * Launch a Puppeteer browser instance.
 */
async function launchBrowser(): Promise<Browser> {
  const executablePath = await getExecutablePath();

  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1920, height: 1080 },
    executablePath,
    headless: true,
  });
}

/**
 * Generate a PDF from an SOW page.
 *
 * @param token - The SOW token (URL path)
 * @param options - PDF generation options
 * @returns PDF as a Buffer
 */
export async function generatePDF(
  token: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL environment variable is required');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: opts.viewportWidth,
      height: opts.viewportHeight,
    });

    // Navigate to the SOW page with print mode enabled
    // The ?print=true query param should trigger print-specific styles
    const url = `${baseUrl}/sow/${token}?print=true`;
    console.log(`Generating PDF for: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for content to be ready
    // The page should have a data-print-ready attribute when fully loaded
    try {
      await page.waitForSelector('[data-print-ready="true"]', {
        timeout: 10000,
      });
    } catch {
      // If selector not found, continue anyway (graceful degradation)
      console.warn('Print ready selector not found, continuing...');
    }

    // Additional wait if specified
    if (opts.additionalWaitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, opts.additionalWaitMs));
    }

    // Generate PDF
    const pdfOptions: PDFOptions = {
      format: opts.format,
      printBackground: opts.printBackground,
      margin: opts.margin,
    };

    const pdf = await page.pdf(pdfOptions);

    return Buffer.from(pdf);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate a PDF with custom content (not from a URL).
 * Useful for generating PDFs from HTML strings.
 *
 * @param html - HTML content to render
 * @param options - PDF generation options
 * @returns PDF as a Buffer
 */
export async function generatePDFFromHTML(
  html: string,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setViewport({
      width: opts.viewportWidth,
      height: opts.viewportHeight,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const pdfOptions: PDFOptions = {
      format: opts.format,
      printBackground: opts.printBackground,
      margin: opts.margin,
    };

    const pdf = await page.pdf(pdfOptions);

    return Buffer.from(pdf);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Take a screenshot of an SOW page (for debugging or thumbnails).
 *
 * @param token - The SOW token
 * @returns Screenshot as a Buffer (PNG)
 */
export async function takeScreenshot(token: string): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL environment variable is required');
  }

  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 800,
    });

    const url = `${baseUrl}/sow/${token}?print=true`;
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    return Buffer.from(screenshot);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
