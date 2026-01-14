import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Load các biến môi trường từ file .env local (nếu có)
  // process.cwd() là thư mục gốc dự án
  const env = loadEnv(mode, (process as any).cwd(), '');

  // 2. Lấy API Key theo thứ tự ưu tiên:
  // - process.env.GEMINI_API_KEY: Biến hệ thống (Vercel Inject lúc Build)
  // - env.GEMINI_API_KEY: Biến từ file .env local
  // - Fallback sang các tên biến khác cũ hơn
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // 3. Inject biến vào code Client-side
      // JSON.stringify là bắt buộc để biến giá trị thành chuỗi hợp lệ trong JS bundle
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    // Đảm bảo port local không bị conflict
    server: {
      port: 3000,
    }
  };
});