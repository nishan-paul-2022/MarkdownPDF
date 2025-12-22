export interface Metadata {
  university?: string;
  program?: string;
  title?: string;
  subtitle?: string;
  course?: string;
  name?: string;
  roll?: string;
  reg?: string;
  batch?: string;
  date?: string;
}

/**
 * Parses metadata from markdown content.
 * Looks for a "# Landing Page" section with key-value pairs in the format:
 * - **Key:** Value
 * or
 * - **Key:** "Value",
 */
export function parseMetadataFromMarkdown(markdown: string): Metadata {
  const metadata: Metadata = {};
  
  // Find the Landing Page section
  const landingPageMatch = markdown.match(/^#\s+Landing\s+Page\s*\n([\s\S]*?)(?=\n#\s+|\n---|\Z)/im);
  
  if (!landingPageMatch) {
    return metadata;
  }
  
  const landingPageContent = landingPageMatch[1];
  
  // Parse each line with format: - **Key:** Value (with or without quotes and commas)
  // This regex handles both formats:
  // - **Key:** "Value",
  // - **Key:** Value
  const lineRegex = /^-\s+\*\*(.+?):\*\*\s+(.+?)\s*$/gm;
  let match;
  
  while ((match = lineRegex.exec(landingPageContent)) !== null) {
    const key = match[1].trim();
    let value = match[2].trim();
    
    // Remove trailing comma if present
    value = value.replace(/,\s*$/, '');
    
    // Remove surrounding quotes if present
    value = value.replace(/^["'](.+?)["']$/, '$1');
    
    // Map the keys to our metadata structure
    const keyMap: Record<string, keyof Metadata> = {
      'University': 'university',
      'Program': 'program',
      'Title': 'title',
      'Subtitle': 'subtitle',
      'Course': 'course',
      'Name': 'name',
      'Roll No': 'roll',
      'Reg. No': 'reg',
      'Batch': 'batch',
      'Submission Date': 'date'
    };
    
    const metadataKey = keyMap[key];
    if (metadataKey && value) {
      metadata[metadataKey] = value;
    }
  }
  
  return metadata;
}

/**
 * Removes the Landing Page section from markdown content
 */
export function removeLandingPageSection(markdown: string): string {
  return markdown.replace(/^#\s+Landing\s+Page\s*\n[\s\S]*?(?=\n#\s+[^#]|\n---|\Z)/im, '').trim();
}

export const DEFAULT_METADATA: Metadata = {};

export const DEFAULT_MARKDOWN_PATH = '/content/default-pki-report.md';
