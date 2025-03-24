import React, { useEffect, useRef, useState } from "react";
import {
	Page,
	Navbar,
	NavTitle,
	NavTitleLarge,
	Link,
	Toolbar,
	Block,
	Button,
	List,
	ListInput,
	f7,
	Progressbar,
	Preloader,
} from "framework7-react";
import { useFFmpeg } from "react-use-ffmpeg";

const HomePage = () => {
	const {
		load,
		unload,
		loaded,
		loading,
		addToQueue,
		queue,
		progress,
		time,
		results,
		transcoding,
	} = useFFmpeg({
		onComplete: (result) => {
			console.log(`File ${result.id} completed:`, result.url);
			const updatedQueue = queue.filter((item) => item.id !== result.id);
			if (updatedQueue.length === 0 && !transcoding) {
				console.log("All processing complete, unloading FFmpeg");
				unload();
			}
		},
	});

	const processFile = (file) => {
		// If FFmpeg is already loaded, add file to queue immediately
		if (loaded) {
			console.log("FFmpeg already loaded, adding file to queue");
			addToQueue(file, file.name, ["-codec", "copy"]);
			return;
		}

		// If FFmpeg is not loading yet, start loading
		if (!loading) {
			console.log("Starting FFmpeg load");
			load().then(() => {
				console.log("FFmpeg loaded, adding file to queue");
				addToQueue(file, file.name, ["-codec", "copy"]);
			});
			return;
		}

		// If FFmpeg is currently loading, show notification and wait
		f7.toast
			.create({
				text: "FFmpeg is loading, please wait...",
				position: "center",
				closeTimeout: 2000,
			})
			.show();

		// Set up polling to check when loading completes
		const checkLoading = () => {
			if (loaded) {
				console.log("FFmpeg finished loading, now adding file to queue");
				addToQueue(file, file.name, ["-codec", "copy"]);
			} else if (loading) {
				// Continue checking with a reasonable interval
				setTimeout(checkLoading, 300);
			}
		};

		// Start the polling
		checkLoading();
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			processFile(file);
		}
	};

	useEffect(() => {
		loading ? f7.preloader.show() : f7.preloader.hide();
	}, [loading]);

	return (
		<Page name="home">
			<Navbar>
				<NavTitle>React FFmpeg Demo</NavTitle>
			</Navbar>
			<Block>
				<>
					{results?.length > 0 &&
						results.map((result, index) => (
							<video
								key={index}
								src={result.url}
								controls></video>
						))}
					<br />
					<List>
						<ListInput
							type="file"
							label="Select a file"
							accept={{
								"video/*": [
									".mp4",
									".m4v",
									".mpg",
									".mpeg",
									".flv",
									".webm",
									".avi",
									".mkv",
									".mov",
									".wmv",
								],
							}}
							onChange={handleFileChange}
						/>
					</List>
					{progress ? (
						<>
							<Progressbar progress={progress} />
							<p
								style={{
									marginTop: "10px",
									width: "100%",
									textAlign: "center",
								}}>
								Time elapsed: {time}s
							</p>
						</>
					) : null}
					<p>
						Open Developer Tools (Ctrl+Shift+I) to View Logs or render anywhere
						with logs state from the hook
					</p>
				</>
			</Block>
		</Page>
	);
};
export default HomePage;
