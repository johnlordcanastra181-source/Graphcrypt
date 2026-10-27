"""
Runner script for Intelligent Text Search, Compression, and Optimization System & GraphCrypt
Bohol Island State University (BISU) Final Project
"""

import sys
from app import app, DEFAULT_HOST, DEFAULT_DEBUG

if __name__ == "__main__":
    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    print(f"==========================================================================")
    print(f"  Intelligent Text Search, Compression, and Optimization System      ")
    print(f"  Precision GraphCrypt v2.0 Algorithm Engine Running                     ")
    print(f"  Access UI at: http://127.0.0.1:{port}                                  ")
    print(f"==========================================================================")
    # The server binds to localhost by default. Set GRAPHCrypt_HOST=0.0.0.0 to
    # expose it on the LAN, and GRAPHCrypt_DEBUG=1 to enable the Werkzeug debugger.
    app.run(host=DEFAULT_HOST, port=port, debug=DEFAULT_DEBUG)
