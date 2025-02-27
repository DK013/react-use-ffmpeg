import React, { useState, useEffect } from "react";

import { f7, f7ready, App, View } from "framework7-react";

import { FFmpegProvider } from "react-use-ffmpeg";

import routes from "../js/routes";
import store from "../js/store";

const MyApp = () => {
	// Framework7 Parameters
	const f7params = {
		name: "react-ffmpeg-demo", // App name
		theme: "auto", // Automatic theme detection
		darkMode: "auto",

		// App store
		store: store,
		// App routes
		routes: routes,
	};

	f7ready(() => {
		// Call F7 APIs here
	});

	return (
		<App {...f7params}>
			<FFmpegProvider>
				<View main className="safe-areas" url="/" />
			</FFmpegProvider>
		</App>
	);
};
export default MyApp;
