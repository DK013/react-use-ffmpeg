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
	const { loaded, loading, addToQueue, queue, progress, time, results, transcoding } =
		useFFmpeg({
			onComplete: (result) => {
				console.log(`File ${result.id} completed:`, result.url);
			},
		});

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			addToQueue(e.target.files[0], e.target.files[0].name, ["-codec", "copy"]);
		}
	};

	useEffect(() => {
		loading ? f7.preloader.show() : f7.preloader.hide();
	}, [loading])

	return (
		<Page name="home">
			<Navbar>
				<NavTitle>React FFmpeg Demo</NavTitle>
			</Navbar>
			{/* Page content */}
			{loaded && (
				<Block>
					<>
						{results?.length > 0 &&
							results.map((result, index) => (
								<video
									key={index}
									src={result.url}
									controls
									className="w-[345px] inline"></video>
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
							Open Developer Tools (Ctrl+Shift+I) to View Logs or render
							anywhere with logs state from the hook
						</p>
					</>
				</Block>
			)}
		</Page>
	);
};
export default HomePage;
