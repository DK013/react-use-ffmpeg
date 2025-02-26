import { useRef, useState } from "react";
import { FFFSType, FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

interface UseFFmpegReturn {
	loaded: boolean;
	loading: boolean;
	load: () => Promise<void>;
	setFile: (file: File) => void;
	file: File | null;
	progress: number;
	time: number;
	transcode: () => Promise<void>;
	transcoding: boolean;
	setArgs: (args: string[]) => void;
	video: string | null;
}

export const useFFmpeg = (ffmpegPath: string | undefined): UseFFmpegReturn => {
	const [loading, setLoading] = useState<boolean>(false);
	const [loaded, setLoaded] = useState<boolean>(false);
	const [progress, setProgress] = useState<number>(0);
	const [time, setTime] = useState<number>(0);
	const [file, setFile] = useState<File | null>(null);
	const [video, setVideo] = useState<string | null>(null);
	const [args, setArgs] = useState<string[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [transcoding, setTranscoding] = useState<boolean>(false);
	const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

	const load = async (): Promise<void> => {
		setLoading(true);
		const baseURL =
			ffmpegPath || "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
		const ffmpeg = ffmpegRef.current;

		ffmpeg.on("log", ({ message }: { message: string }) => {
			setLogs((prevLogs) => [...prevLogs, message]);
			console.log(message);
		});

		ffmpeg.on(
			"progress",
			({ progress, time }: { progress: number; time: number }) => {
				setProgress(Math.round(progress * 100));
				setTime(Math.round(time / 1000000000));
			}
		);

		await ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
			wasmURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.wasm`,
				"application/wasm"
			),
			workerURL: await toBlobURL(
				`${baseURL}/ffmpeg-core.worker.js`,
				"text/javascript"
			),
		});
		setLoaded(true);
		setLoading(false);
	};

	const transcode = async (): Promise<void> => {
        if (!file) return;
        
        setTranscoding(true);

		const ffmpeg = ffmpegRef.current;
		const inputDir = "/input";
		const inputFile = `${inputDir}/${file.name}`;

		await ffmpeg.createDir(inputDir);
		await ffmpeg.mount(
			FFFSType.WORKERFS,
			{
				files: [file],
			},
			inputDir
		);

		await ffmpeg.exec(["-i", inputFile, ...args, "output.mp4"]);
		const data = await ffmpeg.readFile("output.mp4");

		const dataArr =
			data instanceof Uint8Array ? data : new TextEncoder().encode(data);

		setVideo(
			URL.createObjectURL(
				new Blob([dataArr], {
					type: "video/mp4; codecs=avc1.42E01E,mp4a.40.2",
				})
			)
		);

		await ffmpeg.unmount(inputDir);
		await ffmpeg.deleteDir(inputDir);
		setTranscoding(false);
	};

	return {
		loaded,
		loading,
		load,
		setFile,
		file,
		progress,
		time,
        transcode,
        transcoding,
		setArgs,
		video,
	};
};

export default useFFmpeg;
