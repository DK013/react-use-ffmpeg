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

### FFmpegProvider

The `FFmpegProvider` component must wrap any components that use the `useFFmpeg` hook.

#### Props


| Prop            | Type        | Required | Default     | Description                                                       |
| ----------------- | ------------- | ---------- | ------------- | ------------------------------------------------------------------- |
| `children`      | `ReactNode` | Yes      | -           | Child components to be wrapped                                    |
| `autoInit`      | `boolean`   | No       | `true`     | When`true`, automatically initializes FFmpeg on mount             |
| `ffmpegPath`    | `string`    | No       | `undefined` | Custom path to FFmpeg files. If not provided, uses unpkg CDN      |
| `autoTranscode` | `boolean`   | No       | `true`      | When`true`, automatically processes queue items as they are added |

```tsx
<FFmpegProvider 
  autoInit={true}
  ffmpegPath="/path/to/ffmpeg"
  autoTranscode={true}
>
  <YourComponents />
</FFmpegProvider>
```

### useFFmpeg Hook

The main hook for interacting with FFmpeg functionality.

#### Options


| Option       | Type                                       | Required | Description                                            |
| -------------- | -------------------------------------------- | ---------- | -------------------------------------------------------- |
| `onComplete` | `(result: TranscodeResult) => void`        | No       | Callback fired when a file completes processing        |
| `onProgress` | `(progress: number, time: number) => void` | No       | Callback fired during processing with progress updates |
| `onError`    | `(error: Error) => void`                   | No       | Callback fired when an error occurs during processing  |

```tsx
const {
  // State
  loaded,
  loading,
  queue,
  currentItem,
  progress,
  time,
  transcoding,
  results,
  
  // Methods
  load,
  addToQueue,
  clearQueue,
  transcode
} = useFFmpeg({
  onComplete: (result) => console.log('Complete:', result),
  onProgress: (progress, time) => console.log('Progress:', progress, time),
  onError: (error) => console.error('Error:', error)
});
```

#### Return Values

##### State Properties


| Property      | Type                | Description                                      |
| --------------- | --------------------- | -------------------------------------------------- |
| `loaded`      | `boolean`           | Indicates if FFmpeg is loaded and ready          |
| `loading`     | `boolean`           | Indicates if FFmpeg is currently loading         |
| `transcoding` | `boolean`           | Indicates if a file is currently being processed |
| `queue`       | `QueueItem[]`       | Array of files waiting to be processed           |
| `currentItem` | `QueueItem | null`  | The file currently being processed, if any       |
| `progress`    | `number`            | Current processing progress (0-100)              |
| `time`        | `number`            | Processing time in seconds                       |
| `results`     | `TranscodeResult[]` | Array of processed files with their URLs         |

##### Methods


| Method       | Signature                                            | Description                                 |
| -------------- | ------------------------------------------------------ | --------------------------------------------- |
| `load`       | `() => Promise<void>`                                | Manually load FFmpeg if not using`autoInit` |
| `addToQueue` | `(file: File, id?: string, args?: string[]) => void` | Add a file to the processing queue          |
| `clearQueue` | `() => void`                                         | Remove all items from the queue             |
| `transcode`  | `() => Promise<void>`                                | Manually process the next item in the queue |

#### Types

```typescript
interface QueueItem {
  file: File;           // The file to process
  id?: string;          // Optional identifier for the file
  args: string[];       // FFmpeg command line arguments
}

interface TranscodeResult {
  id?: string;          // The ID provided when queuing (if any)
  url: string;          // Blob URL of the processed file
  file: File;          // Original input file
}
```

### Example Usage

For a complete working example, check out the `/example` directory in the repository. It's a Framework7-based React application that demonstrates:

- File selection and upload
- Video transcoding
- Progress tracking
- Result playback

To run the example:

```bash
cd example
npm install
npm start
```

Here's a basic example of how to use the hook in your own project:

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
    transcoding,
    currentItem 
  } = useFFmpeg({
    onComplete: (result) => {
      console.log(`File ${result.id} completed:`, result.url);
    },
    onProgress: (progress, time) => {
      console.log(`Progress: ${progress}%, Time: ${time}s`);
    },
    onError: (error) => {
      console.error('Processing failed:', error);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      // Convert to H.264 MP4
      addToQueue(
        e.target.files[0],
        e.target.files[0].name,
        [
          '-c:v', 'libx264',    // Video codec
          '-c:a', 'aac',        // Audio codec
          '-preset', 'medium',   // Encoding speed preset
          '-crf', '23'          // Quality (lower = better)
        ]
      );
    }
  };

  if (loading) return <div>Loading FFmpeg...</div>;
  if (!loaded) return <div>FFmpeg not loaded</div>;

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="video/*" />
    
      {transcoding && currentItem && (
        <div>
          Processing {currentItem.file.name}: {progress}%
        </div>
      )}
    
      <div>Queue: {queue.length} items</div>
    
      <div>
        {results.map(result => (
          <video 
            key={result.id} 
            src={result.url} 
            controls 
            style={{ maxWidth: '300px' }} 
          />
        ))}
      </div>
    </div>
  );
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

- [X] Add multiple file input option for cases like interpolation
- [ ] Add manual termination support
- [ ] Add Multiple file output option for file splitting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
