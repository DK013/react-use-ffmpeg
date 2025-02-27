/// <reference types="jest" />
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useFFmpeg, FFmpegProvider } from '../src/index';
import { FFFSType } from '@ffmpeg/ffmpeg';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' });

let mockFFmpeg: any;

// Mock FFmpeg module
jest.mock('@ffmpeg/ffmpeg', () => {
  return {
    FFmpeg: jest.fn(() => mockFFmpeg),
    FFFSType: { WORKERFS: 'WORKERFS' }
  };
});

describe('useFFmpeg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock FFmpeg instance
    mockFFmpeg = {
      on: jest.fn(),
      load: jest.fn().mockResolvedValue(undefined),
      createDir: jest.fn().mockResolvedValue(undefined),
      mount: jest.fn().mockResolvedValue(undefined),
      exec: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      unmount: jest.fn().mockResolvedValue(undefined),
      deleteDir: jest.fn().mockResolvedValue(undefined),
    };
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:video-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  const renderWithProvider = (hook: () => any) => {
    return renderHook(hook, {
      wrapper: ({ children }) => (
        <FFmpegProvider autoInit={false} autoTranscode={false}>
          {children}
        </FFmpegProvider>
      )
    });
  };

  it('initializes with default state', () => {
    const { result } = renderWithProvider(() => useFFmpeg());
    expect(result.current.loaded).toBe(false);
    expect(result.current.queue).toEqual([]);
    expect(result.current.results).toEqual([]);
  });

  it('loads FFmpeg', async () => {
    const { result } = renderWithProvider(() => useFFmpeg());
    await act(async () => {
      await result.current.load();
    });
    expect(result.current.loaded).toBe(true);
  });

  it('manages queue', async () => {
    const { result } = renderWithProvider(() => useFFmpeg());
    await act(async () => {
      await result.current.load();
      result.current.addToQueue(mockFile, 'test', ['-c:v', 'libx264']);
      await flushPromises();
    });
    expect(result.current.queue).toHaveLength(1);
  });

  it('processes transcoding with callbacks', async () => {
    const onComplete = jest.fn();
    const { result } = renderWithProvider(() => useFFmpeg({ onComplete }));

    await act(async () => {
      await result.current.load();
      result.current.addToQueue(mockFile, 'test');
      await flushPromises();
    });

    // Get the FFmpeg mock to verify it was called correctly
    const ffmpegMock = (require('@ffmpeg/ffmpeg').FFmpeg)();

    await act(async () => {
      await result.current.transcode();
      await flushPromises();
    });

    expect(ffmpegMock.exec).toHaveBeenCalled();
    expect(ffmpegMock.readFile).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith({
      id: 'test',
      url: 'blob:video-url',
      file: mockFile
    });
  });

  it('handles errors', async () => {
    const mockError = new Error('Transcode failed');
    mockFFmpeg.exec = jest.fn().mockRejectedValue(mockError);

    const onError = jest.fn();
    const { result } = renderWithProvider(() => useFFmpeg({ onError }));

    await act(async () => {
      await result.current.load();
      result.current.addToQueue(mockFile);
      await flushPromises();
    });

    await act(async () => {
      await result.current.transcode();
      // Wait longer for error handling
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockFFmpeg.exec).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(mockError);
  });
}); 