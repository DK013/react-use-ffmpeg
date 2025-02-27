import path from "path";
import react from "@vitejs/plugin-react";
import { searchForWorkspaceRoot } from "vite";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./www");
export default async () => {
	return {
		plugins: [react()],
		root: SRC_DIR,
		base: "",
		publicDir: PUBLIC_DIR,
		build: {
			outDir: BUILD_DIR,
			assetsInlineLimit: 0,
			emptyOutDir: true,
			rollupOptions: {
				treeshake: false,
			},
		},
		resolve: {
			alias: {
				"@": SRC_DIR,
			},
		},
		server: {
			host: true,
			headers: {
				"Cross-Origin-Opener-Policy": "same-origin",
				"Cross-Origin-Embedder-Policy": "require-corp",
			},
			fs: {
				allow: [
					searchForWorkspaceRoot(process.cwd()),
					"D:/Docs/Personal/Projects/Node.JS/Projects/react-use-ffmpeg",
				],
			},
		},
		optimizeDeps: {
			exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
		},
	};
};
