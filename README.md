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

## Basic Usage

```tsx
import { FFmpegProvider, useFFmpeg } from "react-use-ffmpeg";

// Wrap your app with the provider
function App() {
  return (
    <FFmpegProvider>
      <YourComponents />
    </FFmpegProvider>
  );
}

// Use the hook in your components
function VideoProcessor() {
  const { addToQueue, progress, results } = useFFmpeg();

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
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
      <div>Progress: {progress}%</div>
      {results.map(result => (
        <video key={result.id} src={result.url} controls />
      ))}
    </div>
  );
}
```

check the [example folder](https://github.com/dk013/react-use-ffmpeg/tree/main/example) for a complete working example.

## Documentation

For detailed documentation, API reference, and advanced usage examples, please visit:
[https://dk013.github.io/react-use-ffmpeg](https://dk013.github.io/react-use-ffmpeg)

## License

ISC
