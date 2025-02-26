import { renderHook, act } from '@testing-library/react';
import { useFFmpeg } from '../src/index';

describe('useFFmpeg', () => {
  const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFFmpeg({ ffmpegPath: '' }));

    expect(result.current.loaded).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.file).toBeNull();
    expect(result.current.video).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.time).toBe(0);
  });

  it('should load FFmpeg successfully', async () => {
    const { result } = renderHook(() => useFFmpeg({ ffmpegPath: '/test/path' }));

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.loaded).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should set file correctly', () => {
    const { result } = renderHook(() => useFFmpeg({ ffmpegPath: '' }));

    act(() => {
      result.current.setFile(mockFile);
    });

    expect(result.current.file).toBe(mockFile);
  });

  it('should transcode file successfully', async () => {
    const { result } = renderHook(() => useFFmpeg({ ffmpegPath: '' }));

    act(() => {
      result.current.setFile(mockFile);
    });

    await act(async () => {
      await result.current.transcode();
    });

    expect(result.current.video).toBe('blob:video-url');
  });

  it('should not transcode without a file', async () => {
    const { result } = renderHook(() => useFFmpeg({ ffmpegPath: '' }));

    await act(async () => {
      await result.current.transcode();
    });

    expect(result.current.video).toBeNull();
  });

  it('should update progress during transcoding', async () => {
    const { result } = renderHook(() => useFFmpeg({ ffmpegPath: '' }));
    
    await act(async () => {
      await result.current.load();
    });

    // Simulate progress event
    const progressCallback = (jest.requireMock('@ffmpeg/ffmpeg').FFmpeg as jest.Mock).mock.results[0].value.on.mock.calls.find(
      (call: any) => call[0] === 'progress'
    )[1];

    act(() => {
      progressCallback({ progress: 0.5, time: 1000000000 });
    });

    expect(result.current.progress).toBe(50);
    expect(result.current.time).toBe(1);
  });
}); 