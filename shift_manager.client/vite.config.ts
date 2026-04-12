/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@shared": path.resolve(__dirname, "src/shared"),
            "@assets": path.resolve(__dirname, "src", "assets"),
        },
    },
    root: __dirname,
    build: {
        outDir: "dist",
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "https://localhost:7020",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
