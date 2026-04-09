/// <reference types="vite/client" />

// Declaraciones de módulos para assets estáticos
declare module "*.png" { const src: string; export default src; }
declare module "*.jpg" { const src: string; export default src; }
declare module "*.jpeg" { const src: string; export default src; }
declare module "*.svg" { const src: string; export default src; }
declare module "*.webp" { const src: string; export default src; }
