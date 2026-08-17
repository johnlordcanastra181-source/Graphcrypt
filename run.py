"""
Runner script for GraphCrypt v1.0
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
    print(f"=======================================================")
    print(f"  GraphCrypt v1.0 Precision Algorithm Engine Running   ")
    print(f"  Access UI at: http://127.0.0.1:{port}               ")
    print(f"=======================================================")
    app.run(host="0.0.0.0", port=port, debug=True)
