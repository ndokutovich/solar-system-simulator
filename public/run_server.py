#!/usr/bin/env python3
"""
Simple HTTP server to run the solar system simulation
"""

import http.server
import socketserver
import os
import webbrowser

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add CORS headers for ES6 modules
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run_server():
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🌌 Solar System Simulation Server")
        print(f"🚀 Starting server on http://localhost:{PORT}")
        print(f"📁 Serving directory: {DIRECTORY}")
        print(f"\n✨ Open http://localhost:{PORT} in your browser")
        print(f"❌ Press Ctrl+C to stop the server\n")

        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass

        httpd.serve_forever()

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Error: {e}")