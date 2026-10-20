"""
Runner script for Intelligent Text Search, Compression, and Optimization System & GraphCrypt
Bohol Island State University (BISU) Final Project
"""

import sys
from app import app

if __name__ == "__main__":
    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    print(f"==========================================================================")
    print(f"  Intelligent Text Search, Compression, and Optimization System (BISU)   ")
    print(f"  Precision GraphCrypt v2.0 Algorithm Engine Running                     ")
    print(f"  Access UI at: http://127.0.0.1:{port}                                  ")
    print(f"==========================================================================")
    app.run(host="0.0.0.0", port=port, debug=True)
