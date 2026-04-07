const { execSync } = require('child_process');

console.log('--- Bắt đầu chờ LlamaParse Job hoàn tất cho môn Science ---');
try {
    // 1. Chạy tải file từ LlamaParse (nó tự loop chờ r tải xuống)
    execSync('node download_science.mjs', { stdio: 'inherit' });
    console.log('--- Download Markdown thành công. Bắt đầu build AI-Roadmap Ingestion ---');
    
    // 2. Chạy pipeline map milestone + embeddings db
    execSync('cd packages/database && npm run db:ingest Science', { stdio: 'inherit' });
    console.log('--- Tất cả xong! Đã crawl xong cho sách Science ---');
} catch (error) {
    console.error('Lỗi khi chạy auto ingest for science:', error);
}
