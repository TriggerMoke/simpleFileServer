#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const PORT = process.env.PORT || 8080;
const SERVE_DIR = process.cwd();

// MIME types for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml',
};

// Get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  
  return ips;
}

// Generate directory listing HTML
function generateDirectoryListing(dirPath, urlPath) {
  const files = fs.readdirSync(dirPath);
  const items = [];
  
  // Add parent directory link if not at root
  if (urlPath !== '/') {
    items.push({
      name: '..',
      isDirectory: true,
      path: path.join(urlPath, '..')
    });
  }
  
  // Add files and directories
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    items.push({
      name: file,
      isDirectory: stat.isDirectory(),
      path: path.join(urlPath, file),
      size: stat.size,
      modified: stat.mtime
    });
  }
  
  // Sort: directories first, then files
  items.sort((a, b) => {
    if (a.name === '..') return -1;
    if (b.name === '..') return 1;
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Generate HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Index of ${urlPath}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .file-list {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid #eee;
      text-decoration: none;
      color: #333;
      transition: background-color 0.2s;
    }
    .file-item:hover {
      background-color: #f8f9fa;
    }
    .file-item:last-child {
      border-bottom: none;
    }
    .icon {
      margin-right: 12px;
      font-size: 20px;
      width: 24px;
      text-align: center;
    }
    .name {
      flex: 1;
      font-weight: 500;
    }
    .size {
      color: #666;
      margin-right: 20px;
      min-width: 100px;
      text-align: right;
    }
    .modified {
      color: #999;
      min-width: 180px;
      text-align: right;
      font-size: 14px;
    }
    .directory {
      color: #007bff;
    }
    @media (max-width: 768px) {
      .size, .modified {
        display: none;
      }
    }
  </style>
</head>
<body>
  <h1>Index of ${urlPath}</h1>
  <div class="file-list">
    ${items.map(item => {
      const icon = item.isDirectory ? '📁' : '📄';
      const className = item.isDirectory ? 'directory' : '';
      const size = item.isDirectory ? '' : formatSize(item.size);
      const modified = item.name === '..' ? '' : formatDate(item.modified);
      
      return `
        <a href="${item.path}" class="file-item">
          <span class="icon">${icon}</span>
          <span class="name ${className}">${item.name}</span>
          <span class="size">${size}</span>
          <span class="modified">${modified}</span>
        </a>
      `;
    }).join('')}
  </div>
</body>
</html>
  `;
  
  return html;
}

// Format file size
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(date) {
  return date.toLocaleString();
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Decode URL to handle special characters
  const decodedUrl = decodeURIComponent(req.url);
  const filePath = path.join(SERVE_DIR, decodedUrl);
  
  // Security check: prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(SERVE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  
  // Check if file/directory exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    // If it's a directory, show directory listing
    if (stats.isDirectory()) {
      try {
        const html = generateDirectoryListing(filePath, decodedUrl);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    // If it's a file, serve it
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': stats.size
    });
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    });
  });
});

// Start server
server.listen(PORT, () => {
  const ips = getLocalIPs();
  
  console.log('\n🚀 Simple File Server Started!\n');
  console.log('Serving files from:', SERVE_DIR);
  console.log('\nAccess your files at:');
  console.log(`  Local:   http://localhost:${PORT}`);
  
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(`  Network: http://${ip}:${PORT}`);
    });
  }
  
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use.`);
    console.error('Try setting a different port: PORT=3000 npm start');
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
