// This is a minimal PDF.js worker used for server-side PDF text extraction
// It avoids worker-related issues in server environments

class DummyPdfWorker {
  constructor() {
    this.destroyed = false;
    this._port = {
      addEventListener: () => {},
      removeEventListener: () => {},
      postMessage: () => {},
      terminate: () => {}
    };
  }

  destroy() {
    this.destroyed = true;
  }

  get port() {
    return this._port;
  }
}

// This will be used when PDF.js checks for the Node environment
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // In Node.js environment
  module.exports = {
    PDFWorker: DummyPdfWorker
  };
}
