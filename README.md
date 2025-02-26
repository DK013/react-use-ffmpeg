# react-use-ffmpeg

A React hook for using FFmpeg in the browser with ffmpeg.wasm. This hook provides a simple interface to transcode videos directly in the browser using WebAssembly.

## Features

- 🎥 Browser-based video transcoding
- 🪝 Simple React hook interface
- 📊 Progress tracking
- 🔄 Async operations
- 📦 TypeScript support

## Installation

```bash
npm install react-use-ffmpeg
```

## Usage

```tsx
import { useFFmpeg } from "react-use-ffmpeg";

const { load, file, progress, time, transcode, setArgs, video } = useFFmpeg();

```

## API Reference

### useFFmpeg()

Returns an object with the following properties and methods:

#### State

- `loaded` (boolean): Indicates if FFmpeg is loaded and ready
- `loading` (boolean): Indicates if FFmpeg is currently loading
- `transcoding` (boolean): Indicates if transcoding is currently in progress
- `file` (File | null): Current input file
- `video` (string | null): URL of the transcoded video
- `progress` (number): Transcoding progress (0-100)
- `time` (number): Processing time in seconds

#### Methods

- `load(): Promise<void>`: Loads FFmpeg WASM
- `setFile(file: File): void`: Sets the input video file
- `setArgs(args: string[]): void`: Sets FFmpeg command arguments
- `transcode(): Promise<void>`: Starts the transcoding process

## Environment Setup

FFmpeg files are fetched from unpkg CDN by default. You can override this behavior by passing `ffmpegPath` prop to the hook:

```tsx
const { load } = useFFmpeg('https://yourdomain.com/custom/path/to/ffmpeg');
```

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
3. Set the path accordingly
4. Files needed:
   - ffmpeg-core.js
   - ffmpeg-core.wasm
   - ffmpeg-core.worker.js

## Notes

- This hook uses FFmpeg.wasm which runs entirely in the browser
- Large files may take significant time to process but it's extremely fast when using `["-codec", "copy"]` arguments to simply change the video format
- Supported in modern browsers with WebAssembly support
- Memory usage depends on video size and processing options

## Browser Support

- Chrome/Edge (Recommended)
- Firefox
- Safari 16+

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
