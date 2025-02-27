import '@testing-library/jest-dom';

// Mock FFmpeg and util
jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => ({
    on: jest.fn((event, callback) => {
      // Store callbacks for testing
      if (event === 'progress') {
        (global as any).__progressCallback = callback;
      }
      if (event === 'log') {
        (global as any).__logCallback = callback;
      }
    }),
    load: jest.fn().mockResolvedValue(undefined),
    createDir: jest.fn().mockResolvedValue(undefined),
    mount: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])), // More realistic mock data
    unmount: jest.fn().mockResolvedValue(undefined),
    deleteDir: jest.fn().mockResolvedValue(undefined),
  })),
  FFFSType: {
    WORKERFS: 'WORKERFS',
  },
}));

jest.mock('@ffmpeg/util', () => ({
  toBlobURL: jest.fn().mockResolvedValue('blob:url'),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:video-url');

// Clean up global test helpers
afterEach(() => {
  delete (global as any).__progressCallback;
  delete (global as any).__logCallback;
}); 