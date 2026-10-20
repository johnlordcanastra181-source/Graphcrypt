"""
Text Compression Engine
Bohol Island State University (BISU) Final Project
Implements:
1. Huffman Coding (Min-heap tree, prefix codebook, bitstream)
2. Run-Length Encoding (RLE)
3. Dictionary-Based Compression (LZW - Lempel-Ziv-Welch)
Provides:
- Original size (bytes & bits)
- Compressed size (bytes & bits)
- Compression ratio (%)
- Space savings (%)
- Lossless roundtrip verification
"""

import heapq
import math
import time
from typing import Any, Dict, List, Optional, Tuple


# ========================================================
# 1. HUFFMAN CODING
# ========================================================

class HuffmanNode:
    def __init__(self, char: Optional[str], freq: int, left: Optional['HuffmanNode'] = None, right: Optional['HuffmanNode'] = None):
        self.char = char
        self.freq = freq
        self.left = left
        self.right = right

    def __lt__(self, other: 'HuffmanNode') -> bool:
        if self.freq != other.freq:
            return self.freq < other.freq
        # Tie breaker for stability
        c1 = self.char if self.char is not None else ""
        c2 = other.char if other.char is not None else ""
        return c1 < c2

    def to_dict(self) -> Dict[str, Any]:
        """Convert tree node to JSON-serializable dictionary for UI visualization."""
        label = f"'{self.char}'" if self.char is not None else "Branch"
        res: Dict[str, Any] = {
            "name": f"{label} ({self.freq})",
            "char": self.char,
            "freq": self.freq,
        }
        children = []
        if self.left:
            children.append(self.left.to_dict())
        if self.right:
            children.append(self.right.to_dict())
        if children:
            res["children"] = children
        return res


def build_huffman_tree(text: str) -> Optional[HuffmanNode]:
    """Constructs Huffman binary tree using min-heap."""
    if not text:
        return None

    # Frequency map
    freq_map: Dict[str, int] = {}
    for char in text:
        freq_map[char] = freq_map.get(char, 0) + 1

    heap: List[HuffmanNode] = []
    for char, freq in freq_map.items():
        heapq.heappush(heap, HuffmanNode(char, freq))

    # Single character edge case
    if len(heap) == 1:
        root = HuffmanNode(None, heap[0].freq, left=heap[0])
        return root

    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        parent = HuffmanNode(None, left.freq + right.freq, left=left, right=right)
        heapq.heappush(heap, parent)

    return heap[0]


def generate_huffman_codes(root: Optional[HuffmanNode], current_code: str = "", codebook: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """Traverses Huffman tree to generate binary prefix codes."""
    if codebook is None:
        codebook = {}

    if root is None:
        return codebook

    if root.char is not None:
        # If text had only 1 distinct char, current_code is empty; assign "0"
        codebook[root.char] = current_code if current_code else "0"
        return codebook

    if root.left:
        generate_huffman_codes(root.left, current_code + "0", codebook)
    if root.right:
        generate_huffman_codes(root.right, current_code + "1", codebook)

    return codebook


def huffman_compress(text: str) -> Dict[str, Any]:
    """Compresses input text using Huffman Coding."""
    start_time = time.perf_counter()
    if not text:
        return {
            "method": "Huffman Coding",
            "original_text": "",
            "encoded_bits": "",
            "codebook": {},
            "tree": None,
            "original_bytes": 0,
            "compressed_bytes": 0,
            "compression_ratio": 0.0,
            "space_savings": 0.0,
            "time_ms": 0.0,
            "is_lossless": True
        }

    tree_root = build_huffman_tree(text)
    codebook = generate_huffman_codes(tree_root)

    # Encode to bitstring
    encoded_bits = "".join(codebook[c] for c in text)

    original_bytes = len(text.encode('utf-8'))
    # Stored size: (length of bitstream + 7) // 8 + metadata estimation
    compressed_bytes = math.ceil(len(encoded_bits) / 8) if encoded_bits else 0

    ratio = round((compressed_bytes / original_bytes) * 100, 2) if original_bytes > 0 else 0.0
    savings = round(100.0 - ratio, 2) if original_bytes > 0 else 0.0
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    # Sort codebook by frequency descending
    freq_map = {c: text.count(c) for c in set(text)}
    sorted_codebook = sorted(
        [{"char": repr(k)[1:-1] if repr(k).startswith("'") else k, "char_raw": k, "code": v, "freq": freq_map[k], "bits": len(v)}
         for k, v in codebook.items()],
        key=lambda x: x["freq"],
        reverse=True
    )

    return {
        "method": "Huffman Coding",
        "encoded_bits": encoded_bits[:500] + ("..." if len(encoded_bits) > 500 else ""),
        "total_bits": len(encoded_bits),
        "codebook": sorted_codebook,
        "tree": tree_root.to_dict() if tree_root else None,
        "original_bytes": original_bytes,
        "original_bits": original_bytes * 8,
        "compressed_bytes": compressed_bytes,
        "compressed_bits": len(encoded_bits),
        "compression_ratio": ratio,
        "space_savings": savings,
        "time_ms": round(elapsed_ms, 3),
        "details": f"Generated {len(codebook)} unique prefix codes. Total {len(encoded_bits)} bits."
    }


def huffman_decompress(encoded_bits: str, codebook_map: Dict[str, str]) -> str:
    """Decodes Huffman bitstring using reverse codebook."""
    if not encoded_bits or not codebook_map:
        return ""

    reverse_map = {code: char for char, code in codebook_map.items()}
    decoded_chars = []
    current_code = ""

    for bit in encoded_bits:
        current_code += bit
        if current_code in reverse_map:
            decoded_chars.append(reverse_map[current_code])
            current_code = ""

    return "".join(decoded_chars)


# ========================================================
# 2. RUN-LENGTH ENCODING (RLE)
# ========================================================

def rle_compress(text: str) -> Dict[str, Any]:
    """
    Compresses text using Run-Length Encoding.
    Consecutive duplicate characters are encoded as [count][character].
    Best for text with repeating consecutive sequences.
    """
    start_time = time.perf_counter()
    if not text:
        return {
            "method": "Run-Length Encoding (RLE)",
            "encoded_text": "",
            "original_bytes": 0,
            "compressed_bytes": 0,
            "compression_ratio": 0.0,
            "space_savings": 0.0,
            "time_ms": 0.0
        }

    encoded_parts: List[str] = []
    n = len(text)
    i = 0

    while i < n:
        count = 1
        while i + 1 < n and text[i] == text[i + 1]:
            count += 1
            i += 1
        encoded_parts.append(f"{count}{text[i]}")
        i += 1

    encoded_str = "".join(encoded_parts)
    original_bytes = len(text.encode('utf-8'))
    compressed_bytes = len(encoded_str.encode('utf-8'))

    ratio = round((compressed_bytes / original_bytes) * 100, 2) if original_bytes > 0 else 0.0
    savings = round(100.0 - ratio, 2) if original_bytes > 0 else 0.0
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        "method": "Run-Length Encoding (RLE)",
        "encoded_text": encoded_str,
        "runs_count": len(encoded_parts),
        "original_bytes": original_bytes,
        "compressed_bytes": compressed_bytes,
        "compression_ratio": ratio,
        "space_savings": savings,
        "time_ms": round(elapsed_ms, 3),
        "details": f"Compressed into {len(encoded_parts)} run segments."
    }


def rle_decompress(encoded_text: str) -> str:
    """Decompresses RLE encoded string [count][char]."""
    if not encoded_text:
        return ""

    decoded: List[str] = []
    count_str = ""

    for char in encoded_text:
        if char.isdigit():
            count_str += char
        else:
            count = int(count_str) if count_str else 1
            decoded.append(char * count)
            count_str = ""

    return "".join(decoded)


# ========================================================
# 3. DICTIONARY-BASED COMPRESSION (LZW)
# ========================================================

def lzw_compress(text: str) -> Dict[str, Any]:
    """
    Compresses text using Lempel-Ziv-Welch (LZW) dictionary algorithm.
    Time Complexity: O(n)
    Space Complexity: O(dictionary size)
    """
    start_time = time.perf_counter()
    if not text:
        return {
            "method": "LZW Dictionary Compression",
            "codes": [],
            "original_bytes": 0,
            "compressed_bytes": 0,
            "compression_ratio": 0.0,
            "space_savings": 0.0,
            "time_ms": 0.0
        }

    # Initialize dictionary with all ASCII / Latin-1 characters 0..255
    dictionary: Dict[str, int] = {chr(i): i for i in range(256)}
    next_code = 256
    current = ""
    compressed_codes: List[int] = []
    history: List[Dict[str, Any]] = []

    for char in text:
        combo = current + char
        if combo in dictionary:
            current = combo
        else:
            compressed_codes.append(dictionary[current])
            # Add combo to dictionary
            if next_code < 65536:  # 16-bit code limit
                dictionary[combo] = next_code
                if len(history) < 25:
                    history.append({
                        "entry": combo,
                        "code": next_code,
                        "emitted_code": dictionary[current]
                    })
                next_code += 1
            current = char

    if current:
        compressed_codes.append(dictionary[current])

    # Calculate compressed bytes: each code requires ceil(log2(next_code)) bits, minimum 9 bits, stored as 16-bit/2 bytes per code
    code_bit_width = max(9, math.ceil(math.log2(next_code))) if next_code > 1 else 8
    compressed_bits = len(compressed_codes) * code_bit_width
    compressed_bytes = math.ceil(compressed_bits / 8)
    original_bytes = len(text.encode('utf-8'))

    ratio = round((compressed_bytes / original_bytes) * 100, 2) if original_bytes > 0 else 0.0
    savings = round(100.0 - ratio, 2) if original_bytes > 0 else 0.0
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        "method": "LZW Dictionary Compression",
        "codes": compressed_codes[:100],
        "total_codes": len(compressed_codes),
        "dictionary_size": next_code,
        "sample_dictionary_entries": history,
        "code_bit_width": code_bit_width,
        "original_bytes": original_bytes,
        "compressed_bytes": compressed_bytes,
        "compression_ratio": ratio,
        "space_savings": savings,
        "time_ms": round(elapsed_ms, 3),
        "details": f"Dynamically generated {next_code - 256} new dictionary entries with {code_bit_width}-bit codes."
    }


def lzw_decompress(codes: List[int]) -> str:
    """Decompresses LZW codes back to original string."""
    if not codes:
        return ""

    dictionary: Dict[int, str] = {i: chr(i) for i in range(256)}
    next_code = 256

    current_code = codes[0]
    result: List[str] = [dictionary[current_code]]
    prev_str = dictionary[current_code]

    for code in codes[1:]:
        if code in dictionary:
            entry = dictionary[code]
        elif code == next_code:
            entry = prev_str + prev_str[0]
        else:
            raise ValueError(f"Bad LZW compressed code: {code}")

        result.append(entry)
        if next_code < 65536:
            dictionary[next_code] = prev_str + entry[0]
            next_code += 1
        prev_str = entry

    return "".join(result)


def get_compression_stats(original_text: str, method: str = "Huffman") -> Dict[str, Any]:
    """Runs compression, roundtrip decompression verification, and generates full analytics."""
    if method == "Huffman":
        tree_root = build_huffman_tree(original_text)
        codebook = generate_huffman_codes(tree_root)
        comp_res = huffman_compress(original_text)
        # Verify decompression
        full_encoded_bits = "".join(codebook.get(c, "") for c in original_text)
        decompressed = huffman_decompress(full_encoded_bits, codebook)
        comp_res["is_lossless"] = (decompressed == original_text)
        comp_res["decompressed_preview"] = decompressed[:150] + ("..." if len(decompressed) > 150 else "")
        return comp_res

    elif method == "RLE":
        comp_res = rle_compress(original_text)
        decompressed = rle_decompress(comp_res["encoded_text"])
        comp_res["is_lossless"] = (decompressed == original_text)
        comp_res["decompressed_preview"] = decompressed[:150] + ("..." if len(decompressed) > 150 else "")
        return comp_res

    elif method == "LZW":
        comp_res = lzw_compress(original_text)
        # Decompress full code list
        dictionary: Dict[str, int] = {chr(i): i for i in range(256)}
        next_code = 256
        curr = ""
        full_codes: List[int] = []
        for char in original_text:
            combo = curr + char
            if combo in dictionary:
                curr = combo
            else:
                full_codes.append(dictionary[curr])
                if next_code < 65536:
                    dictionary[combo] = next_code
                    next_code += 1
                curr = char
        if curr:
            full_codes.append(dictionary[curr])

        decompressed = lzw_decompress(full_codes)
        comp_res["is_lossless"] = (decompressed == original_text)
        comp_res["decompressed_preview"] = decompressed[:150] + ("..." if len(decompressed) > 150 else "")
        return comp_res

    raise ValueError(f"Unknown compression method: {method}")

