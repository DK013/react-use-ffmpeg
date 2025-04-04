import {
	useRef,
	useState,
	createContext,
	useContext,
	useEffect,
	ReactNode,
	useMemo,
	useCallback,
} from "react";
import { FFFSType, FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

interface FFmpegContextType {
	ffmpeg: FFmpeg;
	loaded: boolean;
	loading: boolean;
	load: () => Promise<void>;
	unload: () => Promise<void>;
	autoTranscode?: boolean;
	transcode: (item?: QueueItem, callbacks?: { 
		onComplete?: (result: TranscodeResult, currentQueue?: QueueItem[]) => void,
		onError?: (error: Error) => void 
	}) => Promise<void>;
}

interface FFmpegProviderProps {
	children: ReactNode;
	autoInit?: boolean;
	ffmpegPath?: string;
	autoTranscode?: boolean;
}

// Create context with a default value
const FFmpegContext = createContext<FFmpegContextType | null>(null);

export const FFmpegProvider = ({
	children,
	autoInit = true,
	autoTranscode = true,
	ffmpegPath,
}: FFmpegProviderProps) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [loaded, setLoaded] = useState<boolean>(false);
	const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [progress, setProgress] = useState<number>(0);
	const [results, setResults] = useState<TranscodeResult[]>([]);
	const [transcoding, setTranscoding] = useState<boolean>(false);

	// Memoize the context value to prevent unnecessary re-renders
	const contextValue = useMemo(
		() => ({
			ffmpeg: ffmpegRef.current,
			autoTranscode,
			loaded,
			loading,
			queue,
			progress,
			results,
			transcoding,
			load: async () => {
				if (loaded || loading) return; // Add guard here
				setLoading(true);
				try {
					const baseURL =
						ffmpegPath ||
						"https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.9/dist/esm";
					const ffmpeg = ffmpegRef.current;

					ffmpeg.on("log", ({ message }: { message: string }) => {
						console.log(message);
					});

					await ffmpeg.load({
						coreURL: await toBlobURL(
							`${baseURL}/ffmpeg-core.js`,
							"text/javascript"
						),
						wasmURL: await toBlobURL(
							`${baseURL}/ffmpeg-core.wasm`,
							"application/wasm"
						),
						workerURL: await toBlobURL(
							`${baseURL}/ffmpeg-core.worker.js`,
							"text/javascript"
						),
					});
				} catch (error) {
					console.error("Failed to load FFmpeg:", error);
					throw error;
				} finally {
					setLoaded(true);
					setLoading(false);
				}
			},
			unload: async () => {
				if (!loaded || loading) return; // Only unload if currently loaded
				
				try {
					// Terminate the FFmpeg instance
					await ffmpegRef.current.terminate();
					
					// Reset state
					setLoaded(false);
					setQueue([]);
					setProgress(0);
					setResults([]);
					
					// Create a new FFmpeg instance for future use
					ffmpegRef.current = new FFmpeg();
					
					console.log("FFmpeg unloaded successfully");
				} catch (error) {
					console.error("Failed to unload FFmpeg:", error);
					throw error;
				}
			},
			addToQueue: async (file: File, id?: string, args: string[] = []) => {
				setQueue((prev) => [...prev, { file, id, args }]);
			},
			clearQueue: () => {
				setQueue([]);
			},
			time: 0,
			transcode: async (item?: QueueItem, callbacks?: { 
				onComplete?: (result: TranscodeResult, currentQueue?: QueueItem[]) => void,
				onError?: (error: Error) => void 
			}) => {
				// If no item is provided, use the first item from the queue
				const nextItem = item || queue[0];
				if (!nextItem) return;
				
				// If we're using an item from the queue, remove it
				let updatedQueue = [...queue]; // Create a copy of the current queue
				if (!item && queue.length > 0) {
					updatedQueue = updatedQueue.slice(1);
					setQueue(updatedQueue);
				}
				
				const inputDir = "/input";

				try {
					setTranscoding(true);
					const inputFile = `${inputDir}/${nextItem.file.name}`;

					await ffmpegRef.current.createDir(inputDir);
					await ffmpegRef.current.mount(
						FFFSType.WORKERFS,
						{ files: [nextItem.file] },
						inputDir
					);

					await ffmpegRef.current.exec(["-i", inputFile, ...nextItem.args, "output.mp4"]);
					const data = await ffmpegRef.current.readFile("output.mp4");
					const dataArr = data instanceof Uint8Array ? data : new TextEncoder().encode(data);

					const url = URL.createObjectURL(
						new Blob([dataArr], { type: "video/mp4; codecs=avc1.42E01E,mp4a.40.2" })
					);

					const result = {
						id: nextItem.id,
						url,
						file: nextItem.file,
					};

					setResults((prev) => [...prev, result]);
					// Always pass the updated queue to the callback
					callbacks?.onComplete?.(result, updatedQueue);
				} catch (error) {
					console.error("Transcoding error:", error);
					callbacks?.onError?.(error as Error);
					throw error; // Re-throw the error after handling
				} finally {
					// Ensure cleanup happens regardless of success or failure
					try {
						await ffmpegRef.current.unmount(inputDir);
						await ffmpegRef.current.deleteDir(inputDir);
					} catch (cleanupError) {
						console.error("Cleanup error:", cleanupError);
					}
					setTranscoding(false);
				}
			}
		}),
		[loaded, loading, queue, progress, results, transcoding, ffmpegPath]
	);

	useEffect(() => {
		if (autoInit && !loaded && !loading) {
			contextValue.load();
		}
	}, [autoInit, contextValue.load, loaded, loading]);

	return (
		<FFmpegContext.Provider value={contextValue}>
			{children}
		</FFmpegContext.Provider>
	);
};

interface QueueItem {
	file: File;
	id?: string;
	args: string[];
	onComplete?: (result: TranscodeResult) => void;
}

interface TranscodeResult {
	id?: string;
	url: string;
	file: File;
}

interface UseFFmpegReturn {
	loaded: boolean;
	loading: boolean;
	load: () => Promise<void>;
	unload: () => Promise<void>;
	addToQueue: (file: File, id?: string, args?: string[]) => void;
	clearQueue: () => void;
	queue: QueueItem[];
	currentItem: QueueItem | null;
	progress: number;
	time: number;
	transcode: () => Promise<void>;
	transcoding: boolean;
	results: TranscodeResult[];
	onComplete?: (result: TranscodeResult) => void;
}

export const useFFmpeg = (options?: {
	onComplete?: (result: TranscodeResult) => void;
	onProgress?: (progress: number, time: number) => void;
	onError?: (error: Error) => void;
}): UseFFmpegReturn => {
	const context = useContext(FFmpegContext);
	if (!context) {
		throw new Error("useFFmpeg must be used within an FFmpegProvider");
	}

	const [progress, setProgress] = useState<number>(0);
	const [time, setTime] = useState<number>(0);
	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
	const [results, setResults] = useState<TranscodeResult[]>([]);
	const [transcoding, setTranscoding] = useState<boolean>(false);

	const { ffmpeg, loaded, loading, load, unload, autoTranscode } = context;

	// Set up progress listener
	useEffect(() => {
		ffmpeg.on(
			"progress",
			({ progress, time }: { progress: number; time: number }) => {
				const progressPercent = Math.round(progress * 100);
				const timeSeconds = Math.round(time / 1000000000);
				setProgress(progressPercent);
				setTime(timeSeconds);
				options?.onProgress?.(progressPercent, timeSeconds);
			}
		);
	}, [ffmpeg, options?.onProgress]);

	const addToQueue = (file: File, id?: string, args: string[] = []) => {
		setQueue((prev) => [...prev, { file, id, args }]);
	};

	const clearQueue = () => {
		setQueue([]);
	};

	// Process queue when it changes or when transcoding completes
	useEffect(() => {
		if (!autoTranscode) return;
		const processQueue = async () => {
			// Only process queue if FFmpeg is loaded and not currently transcoding
			if (!loaded || transcoding || queue.length === 0) return;

			const nextItem = queue[0];
			setCurrentItem(nextItem);
			// Remove item from queue immediately to prevent double processing
			setQueue((prev) => prev.slice(1));

			try {
				setTranscoding(true);
				const inputDir = "/input";
				const inputFile = `${inputDir}/${nextItem.file.name}`;

				await ffmpeg.createDir(inputDir);
				await ffmpeg.mount(
					FFFSType.WORKERFS,
					{ files: [nextItem.file] },
					inputDir
				);

				await ffmpeg.exec(["-i", inputFile, ...nextItem.args, "output.mp4"]);
				const data = await ffmpeg.readFile("output.mp4");
				const dataArr =
					data instanceof Uint8Array ? data : new TextEncoder().encode(data);

				const url = URL.createObjectURL(
					new Blob([dataArr], {
						type: "video/mp4; codecs=avc1.42E01E,mp4a.40.2",
					})
				);

				const result = {
					id: nextItem.id,
					url,
					file: nextItem.file,
				};

				setResults((prev) => [...prev, result]);
				options?.onComplete?.(result);

				await ffmpeg.unmount(inputDir);
				await ffmpeg.deleteDir(inputDir);
			} catch (error) {
				console.error("Transcoding error:", error);
				options?.onError?.(error as Error);
			} finally {
				setTranscoding(false);
				setCurrentItem(null);
			}
		};

		processQueue();
	}, [
		queue,
		transcoding,
		loaded,
		ffmpeg,
		options?.onComplete,
		options?.onError,
	]);

	// Keep transcode method for backward compatibility
	const transcode = async (): Promise<void> => {
		if (queue.length === 0) return;
		// Get the first item but don't modify the queue yet
		const item = queue[0];
		// Remove the item from the queue immediately
		setQueue((prev) => prev.slice(1));
		
		await context.transcode(item, {
			onComplete: options?.onComplete,
			onError: options?.onError
		});
	};

	return {
		loaded,
		loading,
		load,
		unload,
		addToQueue,
		clearQueue,
		queue,
		currentItem,
		progress,
		time,
		transcode,
		transcoding,
		results,
		onComplete: options?.onComplete,
	};
};

export default useFFmpeg;
