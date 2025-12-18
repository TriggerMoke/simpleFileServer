# simpleFileServer

A simple HTTP file server for quickly sharing files over local WiFi. Perfect for transferring files between devices on the same network without any complex setup.

## Features

- 🚀 Quick start - just run one command
- 📁 Directory browsing with a clean interface
- 🌐 Automatic detection and display of local IP addresses
- 📱 Mobile-friendly responsive design
- 🔒 Basic security to prevent directory traversal attacks
- 📄 Support for common file types with proper MIME types

## Installation

```bash
npm install -g simplefileserver
```

Or run directly with npx (no installation required):

```bash
npx simplefileserver
```

## Usage

### Quick Start

Navigate to the directory you want to share and run:

```bash
npm start
```

Or if installed globally:

```bash
simplefileserver
```

The server will start and display the URLs you can use to access your files:

```
🚀 Simple File Server Started!

Serving files from: /path/to/your/directory

Access your files at:
  Local:   http://localhost:8080
  Network: http://192.168.1.100:8080

Press Ctrl+C to stop the server
```

### Custom Port

To use a different port, set the PORT environment variable:

```bash
PORT=3000 npm start
```

Or:

```bash
PORT=3000 simplefileserver
```

## Use Case

This tool is perfect for:

- Quickly sharing files with other devices on the same WiFi network
- Transferring files from your laptop to your phone or tablet
- Sharing documents during meetings without email or cloud services
- Testing web applications locally
- Accessing files from any device with a web browser

## How It Works

1. Start the server in any directory
2. The server displays your local IP address and port
3. Open the URL on any device connected to the same WiFi network
4. Browse and download files through your web browser

## Security Note

This server is designed for use on trusted local networks only. It should not be exposed to the public internet as it:

- Serves files from your current directory without authentication
- Does not use HTTPS
- Is meant for temporary, local file sharing only

Always stop the server when you're done sharing files.

## Requirements

- Node.js (version 10 or higher)

## License

ISC