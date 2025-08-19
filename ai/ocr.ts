/**
 * OCR.space API integration for SkyVault
 * Enables extracting text from scanned/image-based PDFs
 */

/**
 * Helper function to extract error message from any type
 */
function extractError(error: any): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error?.message === 'string') return error.message;
  return 'unknown error';
}

/**
 * Performs OCR on an image or PDF file using OCR.space API
 * @param fileUrl URL of the file to process
 * @param options Additional OCR options
 * @returns Extracted text or error information
 */
export async function performOCR(
  fileUrl: string,
  options?: {
    language?: string;
    isTable?: boolean;
    detectOrientation?: boolean;
  }
): Promise<{
  text: string | null;
  error?: string;
  debugInfo?: any;
  processingTimeMs?: number;
}> {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      console.log('[ocr] Missing API key');
      return { text: null, error: 'ocr_missing_api_key' };
    }

    const form = new FormData();
    form.append('apikey', apiKey);
    form.append('url', fileUrl);
    form.append('language', options?.language || 'eng');
    form.append('filetype', 'PDF');
    form.append('scale', 'true');
    form.append('OCREngine', '2');
    
    if (options?.isTable) {
      form.append('isTable', 'true');
    }
    
    if (options?.detectOrientation) {
      form.append('detectOrientation', 'true');
    }
    
    console.log('[ocr] Sending request to OCR.space API for:', fileUrl);
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://api.ocr.space/parse/image', { 
        method: 'POST', 
        body: form 
      });
      
      const processingTimeMs = Date.now() - startTime;
      console.log(`[ocr] Response received in ${processingTimeMs}ms with status: ${response.status}`);
      
      if (!response.ok) {
        return { 
          text: null, 
          error: `ocr_http_${response.status}`,
          processingTimeMs
        };
      }
      
      const json: any = await response.json();
      
      if (json.IsErroredOnProcessing) {
        console.log('[ocr] API reported error:', json.ErrorMessage || json.ErrorDetails);
        return { 
          text: null, 
          error: `ocr_api_error:${json.ErrorMessage || json.ErrorDetails || 'unknown'}`,
          processingTimeMs,
          debugInfo: json
        };
      } 
      
      if (Array.isArray(json.ParsedResults) && json.ParsedResults.length) {
        // Combine text from all pages
        const combined = json.ParsedResults
          .map((r: any) => (r.ParsedText || ''))
          .join('\n')
          .trim();
          
        if (combined) {
          console.log(`[ocr] Successfully extracted ${combined.length} characters in ${processingTimeMs}ms`);
          const preview = combined.slice(0, 200).replace(/\s+/g, ' ');
          console.log(`[ocr] Preview(0-200): ${preview}`);
          
          return { 
            text: combined,
            processingTimeMs,
            debugInfo: {
              exitCode: json.OCRExitCode,
              pageCount: json.ParsedResults.length,
              processingTimeInMilliseconds: json.ProcessingTimeInMilliseconds
            }
          };
        }
      }
      
      console.log('[ocr] No parsed results returned from API');
      return { 
        text: null, 
        error: 'ocr_no_parsed_results',
        processingTimeMs,
        debugInfo: json
      };
    } catch (fetchError) {
      console.error('[ocr] Fetch error:', extractError(fetchError));
      return {
        text: null,
        error: `ocr_fetch_error:${extractError(fetchError)}`
      };
    }
  } catch (e) {
    console.error('[ocr] Exception:', extractError(e));
    return { 
      text: null, 
      error: `ocr_exception:${extractError(e)}` 
    };
  }
}
