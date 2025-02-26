import '@testing-library/jest-dom';

// Mock FFmpeg and util
jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    load: jest.fn().mockResolvedValue(undefined),
    createDir: jest.fn().mockResolvedValue(undefined),
    mount: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(new Uint8Array()),
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