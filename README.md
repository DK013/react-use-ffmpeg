![NPM Version](https://img.shields.io/npm/v/react-use-ffmpeg)

# react-use-ffmpeg

A React hook for using FFmpeg in the browser with ffmpeg.wasm. This hook provides a simple interface to transcode videos directly in the browser using WebAssembly.

## Features

- 🎥 Browser-based video transcoding
- 🪝 Simple React hook interface
- 📊 Progress tracking
- 🔄 Queue system for multiple files
- 🏷️ File identification support
- 📦 TypeScript support

## Installation

```bash
npm install react-use-ffmpeg
```

## Usage

First, wrap your application with the FFmpegProvider:

```tsx
import { FFmpegProvider } from "react-use-ffmpeg";

function App() {
  return (
    <FFmpegProvider autoInit ffmpegPath="optional-custom-path">
      <YourComponents />
    </FFmpegProvider>
  );
}
```

Then use the hook in your components:

```tsx
import { useFFmpeg } from "react-use-ffmpeg";

function VideoProcessor() {
  const { 
    loaded, 
    loading, 
    addToQueue, 
    queue, 
    progress, 
    results,
    transcoding 
  } = useFFmpeg({
    onComplete: (result) => {
      console.log(`File ${result.id} completed:`, result.url);
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      // Add file to queue with an ID and FFmpeg arguments
      addToQueue(
        e.target.files[0],
        e.target.files[0].name,
        ['-c:v', 'libx264']
      );
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {transcoding && <div>Progress: {progress}%</div>}
      {results.map(result => (
        <video key={result.id} src={result.url} controls />
      ))}
    </div>
  );
}
```

## API Reference

### FFmpegProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| autoInit | boolean | false | Automatically initialize FFmpeg when mounted |
| ffmpegPath | string | undefined | Custom path to FFmpeg files |
| children | ReactNode | - | Child components |

### useFFmpeg Hook

Returns an object with the following properties and methods:

#### State

- `loaded` (boolean): Indicates if FFmpeg is loaded and ready
- `loading` (boolean): Indicates if FFmpeg is currently loading
- `transcoding` (boolean): Indicates if transcoding is in progress
- `queue` (QueueItem[]): Current queue of files to process
- `currentItem` (QueueItem | null): Currently processing item
- `results` (TranscodeResult[]): Array of processed files
- `progress` (number): Transcoding progress (0-100)
- `time` (number): Processing time in seconds

#### Methods

- `load(): Promise<void>`: Loads FFmpeg WASM (if not using autoInit)
- `addToQueue(file: File, id?: string, args?: string[]): void`: Adds a file to the processing queue
- `clearQueue(): void`: Clears the processing queue
- `transcode(): Promise<void>`: Processes the current item (mainly for backward compatibility)

#### Types

```typescript
interface QueueItem {
  file: File;
  id?: string;
  args: string[];
}

interface TranscodeResult {
  id?: string;
  url: string;
  file: File;
}

interface UseFFmpegOptions {
  onComplete?: (result: TranscodeResult) => void;
}
```

## Environment Setup

FFmpeg files are fetched from unpkg CDN by default. You can override this by providing a custom path to the FFmpegProvider.

### Vite Configuration

When using with Vite, you need to set specific headers and optimizeDeps in your `vite.config.ts`:

```ts
export default defineConfig({
  server: {
    host: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});
```

These headers are required for SharedArrayBuffer support, which FFmpeg.wasm needs to function properly.

For local development with files served from your public directory:

1. Download FFmpeg files from [@ffmpeg/core-mt](https://www.npmjs.com/package/@ffmpeg/core-mt)
2. Place them in `public/ffmpeg/`
3. Set the path in FFmpegProvider
4. Files needed:
   - ffmpeg-core.js
   - ffmpeg-core.wasm
   - ffmpeg-core.worker.js

## Notes

- Files are processed one at a time in the order they were added
- Each file can have its own FFmpeg arguments
- The `onComplete` callback is triggered after each file is processed
- URLs in results should be cleaned up when no longer needed
- Memory usage depends on video size and processing options

## Browser Support

- Chrome/Edge (Recommended)
- Firefox
- Safari 16+

## License

ISC

## To-Do

- [x] Add multiple file input option for cases like interpolation
- [ ] Add manual termination support
- [ ] Add Multiple file output option for file splitting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
