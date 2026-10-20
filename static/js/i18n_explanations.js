/**
 * GraphCrypt & Intelligent Text Suite
 * Multilingual Step-by-Step Educational Flow Explanations
 * Bohol Island State University (BISU) Final Project
 * 
 * Supports:
 *   - 'en': English (Academic & Technical Standard)
 *   - 'tl': Tagalog (Filipino National Language)
 *   - 'ceb': Cebuano / Bisaya (Boholano Mother Tongue)
 * 
 * 100% Offline / Localhost Ready. Zero external network dependencies.
 */

window.I18N_LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸', name: 'English' },
    { code: 'tl', label: 'Tagalog', flag: '🇵🇭', name: 'Filipino' },
    { code: 'ceb', label: 'Cebuano', flag: '🏝️', name: 'Bisaya' }
];

window.I18N_UI = {
    en: {
        lang_title: 'Select Language',
        why_result_title: 'Why this Result?',
        flow_title: 'Step-by-Step Execution Mechanics',
        summary_title: 'Analysis Summary',
        lossless_title: '100% Lossless Round-Trip Verification',
        step_lbl: 'Step',
        details_lbl: 'Details',
        codebook_lbl: 'Prefix Codebook',
        dictionary_lbl: 'Dynamic Dictionary',
        runs_lbl: 'Run Segments',
        matches_found: 'matches found',
        comparisons_made: 'comparisons made',
        speedup_factor: 'speedup factor',
        space_savings: 'space savings',
        exact_optimum: 'Exact Optimum',
        heuristic_approx: 'Heuristic Approximation'
    },
    tl: {
        lang_title: 'Pumili ng Wika',
        why_result_title: 'Bakit Ganyan ang Resulta?',
        flow_title: 'Hakbang-sa-Hakbang na Proseso ng Algoritmo',
        summary_title: 'Buod ng Pagsusuri',
        lossless_title: '100% Walang Pagkawala (Lossless) na Pagpapatunay',
        step_lbl: 'Hakbang',
        details_lbl: 'Mga Detalye',
        codebook_lbl: 'Talahanayan ng Kodigo (Codebook)',
        dictionary_lbl: 'Dynamic na Diksyunaryo',
        runs_lbl: 'Mga Segment ng Pag-uulit (Runs)',
        matches_found: 'mga tugmang nahanap',
        comparisons_made: 'mga paghahambing na ginawa',
        speedup_factor: 'antas ng pabilis',
        space_savings: 'natipid na espasyo',
        exact_optimum: 'Eksaktong Pinakamainam (Optimum)',
        heuristic_approx: 'Pagtantiyang Heuristic'
    },
    ceb: {
        lang_title: 'Pilia ang Pinulongan',
        why_result_title: 'Nganong Inani ang Resulta?',
        flow_title: 'Lakang-sa-Lakang nga Proseso sa Algoritmo',
        summary_title: 'Katingbanan sa Pagsusi',
        lossless_title: '100% Lossless nga Pagpamatuod (Walay Nawala)',
        step_lbl: 'Lakang',
        details_lbl: 'Mga Detalye',
        codebook_lbl: 'Talaan sa Kodigo (Codebook)',
        dictionary_lbl: 'Dynamic nga Diksyunaryo',
        runs_lbl: 'Mga Bahin sa Balik-balik (Runs)',
        matches_found: 'mga nakit-ang pareho',
        comparisons_made: 'mga pagtandi nga nahimo',
        speedup_factor: 'paspas nga labaw',
        space_savings: 'na-save nga espasyo',
        exact_optimum: 'Eksaktong Kinamaayohan (Optimum)',
        heuristic_approx: 'Banabanang Heuristic'
    }
};

window.I18N_EXPLANATIONS = {
    // ==========================================
    // ENGLISH (Academic & Clear)
    // ==========================================
    en: {
        pattern_comparison_summary: "Analysis Summary: Knuth-Morris-Pratt ({kmp_comps} comparisons) and Boyer-Moore ({bm_comps} comparisons) outperformed Brute Force ({bf_comps} comparisons) because they use precomputed heuristic tables to skip redundant character comparisons whenever a mismatch occurs.",
        
        kmp: {
            title: "Knuth-Morris-Pratt (KMP) Algorithm",
            why: "KMP found {match_count} match(es) in strictly linear O(n + m) time using {comparisons} character comparisons. It achieves optimal search speed by ensuring the text reading pointer never moves backward.",
            steps: [
                "Step 1 (Precomputation): Built the Longest Proper Prefix which is also a Suffix (LPS) array for pattern '{pattern}'. LPS = [{lps}].",
                "Step 2 (Forward Scan): Scans text characters from left to right. Characters matching the pattern advance both pointers.",
                "Step 3 (Mismatch Shift): Upon mismatch at pattern index j, KMP does NOT rewind the text pointer. Instead, it resets j = LPS[j - 1], preserving already-matched prefixes."
            ]
        },

        boyer_moore: {
            title: "Boyer-Moore (Bad Character Heuristic)",
            why: "Boyer-Moore found {match_count} match(es) using only {comparisons} character comparisons. By comparing characters from right-to-left within each search window, it skips ahead by up to m={pattern_len} characters in a single jump, achieving sublinear average speed Ω(n / m).",
            steps: [
                "Step 1 (Shift Table): Precomputed the Bad Character table recording the rightmost occurrence of each character in the pattern.",
                "Step 2 (Right-to-Left Verification): Aligns pattern with text and checks characters starting from the end of the pattern towards the front.",
                "Step 3 (Sublinear Skipping): When a mismatch occurs on character 'c', the search window shifts forward so that 'c' aligns with its last occurrence in the pattern. If 'c' is absent, the window skips completely past it."
            ]
        },

        rabin_karp: {
            title: "Rabin-Karp (Rolling Polynomial Hash)",
            why: "Rabin-Karp found {match_count} match(es) with {comparisons} comparisons and recorded {spurious_hits} spurious hash collision(s). It evaluates candidate substrings in O(1) arithmetic time per step using a rolling hash function.",
            steps: [
                "Step 1 (Hash Computation): Computed the polynomial hash value ({pattern_hash}) of pattern '{pattern}' using base 256 modulo prime 1,000,003.",
                "Step 2 (Rolling Update): Shifts the sliding window across the corpus in O(1) operations by subtracting the outgoing character's value and appending the incoming character.",
                "Step 3 (Collision Verification): Only when the window hash matches the pattern hash is a character-by-character check executed to confirm true equality and filter spurious hits."
            ]
        },

        brute_force: {
            title: "Brute Force String Matching",
            why: "Brute Force found {match_count} match(es) using {comparisons} comparisons. While simple and requiring zero precomputational memory (O(1) space), it re-examines characters repeatedly, reaching worst-case O(n · m) complexity.",
            steps: [
                "Step 1 (Exhaustive Alignment): Tests every possible starting index i from 0 up to n - m in the text.",
                "Step 2 (Character-by-Character Comparison): For each index i, checks characters sequentially from j = 0 to m - 1.",
                "Step 3 (Full Reset): On any mismatch, the search window shifts by only 1 character (i = i + 1) and restarts comparison from the beginning of the pattern."
            ]
        },

        approximate: {
            title: "Approximate String Matching (Levenshtein Distance)",
            why: "Approximate search identified {match_count} segment(s) within the permitted edit tolerance of d ≤ {max_distance}. It tolerates typographical errors, spelling variations, and genomic mutations using dynamic programming.",
            steps: [
                "Step 1 (Dynamic Programming Grid): Constructs an (m + 1) × (k + 1) cost matrix where cell D[i, j] represents minimum edit operations.",
                "Step 2 (Operation Weights): Evaluates cost of insertion (weight 1), deletion (weight 1), and substitution (weight 1 if characters differ, 0 if equal).",
                "Step 3 (Threshold Filtering): Extracts all text windows where the final calculated Levenshtein edit distance satisfies d ≤ {max_distance}."
            ]
        },

        huffman: {
            title: "Huffman Coding Compression",
            why: "Huffman reduced the source text from {orig_bytes} bytes to {comp_bytes} bytes, achieving a {compression_ratio}% compression ratio ({space_savings}% space savings). Frequently occurring characters were assigned short binary prefix codes, approaching Shannon's information entropy limit.",
            steps: [
                "Step 1 (Frequency Analysis): Scanned the corpus and counted character occurrences across {symbol_count} unique symbols.",
                "Step 2 (Min-Heap Priority Tree): Iteratively merged the two nodes with the lowest frequencies into a parent node until a single root was formed.",
                "Step 3 (Prefix Code Assignment): Traversed the tree assigning binary '0' to left branches and '1' to right branches, guaranteeing no code is a prefix of another.",
                "Step 4 (Lossless Round-Trip Verification): Successfully decoded the bitstream back into the original text with 100% byte-for-byte fidelity."
            ]
        },

        rle: {
            title: "Run-Length Encoding (RLE)",
            why: "RLE compressed the data into {runs_count} consecutive run segments, with the longest consecutive identical sequence measuring {longest_run} character(s). Resulted in {comp_bytes} bytes ({space_savings}% space savings). Highly effective on repetitive sequences; may increase size on diverse text.",
            steps: [
                "Step 1 (Sequential Scanning): Traverses characters while counting consecutive repetitions of the exact same character.",
                "Step 2 (Token Encoding): Whenever a character changes or the stream ends, emits the count followed by the character (e.g. 'AAAAA' becomes '5A').",
                "Step 3 (Decompression Check): Iterated over encoded pairs to reconstruct the exact original corpus with 100% integrity."
            ]
        },

        lzw: {
            title: "Lempel-Ziv-Welch (LZW) Compression",
            why: "LZW dynamically built a dictionary of {dictionary_size} phrases and emitted {codes_count} integer codes of {bit_width}-bit width. Achieved {comp_bytes} compressed bytes ({space_savings}% savings) without transmitting a separate codebook.",
            steps: [
                "Step 1 (Dictionary Initialization): Preloaded initial dictionary with 256 single-character ASCII tokens (indices 0 to 255).",
                "Step 2 (Phrase Accumulation): Reads characters into current buffer W. When W + K is not found in the dictionary, outputs code for W and creates new dictionary entry for W + K.",
                "Step 3 (Adaptive Learning): Automatically discovers repetitive words and syntax phrases on the fly as it reads through the text.",
                "Step 4 (Lossless Verification): Decompressed the emitted code stream by reconstructing the identical dictionary state in lockstep."
            ]
        },

        compression_compare_summary: "Multi-Method Compression Analysis:\n• Huffman Coding: Best for natural language text, assigning bit lengths inversely proportional to character frequencies.\n• Run-Length Encoding (RLE): Maximally efficient on repetitive runs (e.g. genomic DNA blocks), but expands diverse prose.\n• LZW Compression: Excels at structured text with recurring multi-word phrases by building a dynamic phrase dictionary.",

        genetic_algorithm: {
            title: "Genetic Algorithm (GA) Metaheuristic",
            why: "The Genetic Algorithm optimized the 0/1 knapsack configuration over {generations} generations with a population of {population_size} chromosomes. Best fitness evolved from {initial_fitness} up to {final_fitness}, achieving {optimality_ratio}% of the theoretical DP global optimum.",
            steps: [
                "Step 1 (Population Initialization): Generated {population_size} random binary chromosomes representing item selection vectors.",
                "Step 2 (Fitness Evaluation): Calculated total item value for each chromosome, penalizing invalid vectors exceeding capacity {capacity}.",
                "Step 3 (Selection & Crossover): Applied tournament selection to choose parent chromosomes and executed single-point crossover with probability {cx_rate}.",
                "Step 4 (Mutation & Elitism): Injected random bit-flip mutations with probability {mut_rate} to maintain genetic diversity while preserving the best individual (elitism)."
            ]
        },

        knapsack_dp_greedy: {
            title: "0/1 Knapsack: Dynamic Programming vs Greedy Heuristic",
            why: "Dynamic Programming guaranteed the absolute global maximum value ({dp_val}) in O(n · W) time. The Greedy heuristic sorted items by value-to-weight ratio to achieve {greedy_val} in O(n log n) time ({optimality_ratio}% of optimal).",
            steps: [
                "Step 1 (DP Optimal Substructure): Built a 2D table DP[i][w] recording maximum value using subset of first i items within weight budget w.",
                "Step 2 (DP Decision Formula): DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i]] + value[i]), guaranteeing exact global optimality.",
                "Step 3 (Greedy Ratio Sort): Sorted items descending by ratio (Value / Weight) and greedily took complete items until capacity was filled."
            ]
        },

        parallel_search: {
            title: "Parallel Multi-Threaded Pattern Search",
            why: "Multi-threaded search across {workers} worker threads achieved a {speedup}x speedup ({parallel_time} µs parallel vs {seq_time} µs sequential). Text partition boundary overlap prevents any false negatives.",
            steps: [
                "Step 1 (Chunk Partitioning): Segmented the {char_count}-character text into {workers} balanced chunks assigned to concurrent worker threads.",
                "Step 2 (Boundary Overlap Margin): Extended each non-terminal chunk by an overlap margin of (m - 1) = {overlap} characters to capture patterns spanning chunk borders.",
                "Step 3 (Concurrent Execution): Worker threads simultaneously executed the KMP search algorithm on their respective memory segments.",
                "Step 4 (Deduplication & Assembly): Merged worker match indices and deduplicated matches detected within overlap zones."
            ]
        },

        randomized_quicksort: {
            title: "Randomized QuickSort",
            why: "Randomized QuickSort sorted {count} tokens in {time_us} µs using {comparisons} comparisons at a maximum recursion depth of {depth}. Random pivot selection eliminates the worst-case O(n²) trap on pre-sorted data, ensuring expected O(n log n) time.",
            steps: [
                "Step 1 (Random Pivot Selection): In each sub-array, selects a random index uniformly, swapping it with the end element.",
                "Step 2 (Partitioning): Rearranges elements so that all values smaller than the pivot precede it, and larger values follow it.",
                "Step 3 (Divide & Conquer): Recursively sorts the left and right partitions independently."
            ]
        },

        randomized_quickselect: {
            title: "Randomized QuickSelect (k-th Order Statistic)",
            why: "QuickSelect found the rank k={k} element ('{element}') in expected O(n) linear time ({time_us} µs). Because it only branches into one partition, it operates twice as fast as full sorting.",
            steps: [
                "Step 1 (Random Pivot): Chooses a random pivot element to partition the list into smaller and larger elements.",
                "Step 2 (Index Assessment): If pivot ends up exactly at target index k, the element is returned immediately.",
                "Step 3 (Single-Branch Pruning): If k < pivot index, recurse only into the left subarray; otherwise recurse only into the right subarray."
            ]
        },

        astar_pathfinding: {
            title: "Weighted A* Pathfinding",
            why: "A* resolved the shortest route from '{start}' to '{goal}' with an optimal cost of {cost}, visiting {visited} nodes. By prioritizing nodes using f(n) = g(n) + h(n), it avoids exploring unpromising graph regions.",
            steps: [
                "Step 1 (Priority Evaluation): Maintains an open priority queue ordered by f(n) = g(n) + h(n).",
                "Step 2 (Edge Relaxation): Explores outgoing edges, updating g(neighbor) if a lower-cost path from start is discovered.",
                "Step 3 (Goal Termination): As soon as goal node '{goal}' is extracted from the priority queue, the minimum-cost path is guaranteed and reconstructed via parent pointers."
            ]
        },

        caesar_cipher: {
            title: "Modulo-10 Caesar Cipher Transformation",
            why: "Transformed edge weights using cyclic modular arithmetic: E(w) = (w + shift) mod 10 with shift = {shift}. Preserves numerical structure while obfuscating sensitive transmission values.",
            steps: [
                "Step 1 (Digit Parsing): Isolates numerical characters while maintaining decimal points and punctuation.",
                "Step 2 (Modular Shift): For each digit d, computes d' = (d + {shift}) mod 10.",
                "Step 3 (Report Generation): Outputs encrypted edge weights into downloadable TXT files for secure verification."
            ]
        }
    },

    // ==========================================
    // TAGALOG (Malinis at Madaling Intindihin)
    // ==========================================
    tl: {
        pattern_comparison_summary: "Buod ng Pagsusuri: Ang KMP ({kmp_comps} comparisons) at Boyer-Moore ({bm_comps} comparisons) ay naging mas mabilis kaysa Brute Force ({bf_comps} comparisons) dahil gumagamit sila ng mga precomputed heuristic tables upang maiwasan ang muling pagsusuri sa mga karakter na tugma na.",

        kmp: {
            title: "Knuth-Morris-Pratt (KMP) Algorithm",
            why: "Nahanap ng KMP ang {match_count} tugma sa strictly linear O(n + m) time gamit ang {comparisons} paghahambing ng karakter. Mabilis ito dahil hindi kailanman bumabalik ang pointer ng teksto.",
            steps: [
                "Hakbang 1 (Precomputation): Binuo ang Longest Proper Prefix which is also a Suffix (LPS) array para sa pattern na '{pattern}'. LPS = [{lps}].",
                "Hakbang 2 (Pagsusuri Pahilaga): Sinusuri ang mga karakter mula kaliwa pakanan. Kapag tumutugma, sumusulong ang dalawang pointers.",
                "Hakbang 3 (Paglaktaw sa Mismatch): Kapag may hindi tumugma sa pattern index j, HINDI bumabalik ang text pointer. Sa halip, itinatakda ang j = LPS[j - 1] upang magpatuloy batay sa naunang tumugmang prefix."
            ]
        },

        boyer_moore: {
            title: "Boyer-Moore (Bad Character Heuristic)",
            why: "Nahanap ng Boyer-Moore ang {match_count} tugma gamit lamang ang {comparisons} paghahambing. Dahil sumusuri ito mula kanan pakaliwa sa bawat window, lumalaktaw ito nang hanggang m={pattern_len} karakter sa isang hakbang lang, kaya sublinear ang bilis nitong Ω(n / m).",
            steps: [
                "Hakbang 1 (Shift Table): Inihanda ang Bad Character table kung saan nakatala ang huling posisyon ng bawat karakter sa pattern.",
                "Hakbang 2 (Pagsusuri Kanan-Pakaliwa): Itinatapat ang pattern sa teksto at sinusuri ang mga titik mula dulo ng pattern papuntang unahan.",
                "Hakbang 3 (Mabilisang Paglaktaw): Kapag may mismatch sa karakter na 'c', iniuusad ang pattern upang itapat ang 'c' sa huling posisyon nito sa pattern. Kung wala ang 'c', nilalaktawan agad ang buong window."
            ]
        },

        rabin_karp: {
            title: "Rabin-Karp (Rolling Polynomial Hash)",
            why: "Nahanap ng Rabin-Karp ang {match_count} tugma na may {comparisons} paghahambing at nakapagtala ng {spurious_hits} spurious hash collision(s). Sinusuri nito ang bawat window sa bilis na O(1) arithmetic operations gamit ang rolling hash formula.",
            steps: [
                "Hakbang 1 (Kuwenta ng Hash): Kinalkula ang polynomial hash value ({pattern_hash}) ng pattern na '{pattern}' gamit ang base 256 at prime modulo 1,000,003.",
                "Hakbang 2 (Rolling Update): Habang umuusad ang window sa teksto, kinukwenta ang bagong hash sa O(1) sa pamamagitan ng pagbawas ng lumabas na karakter at pagdagdag ng pumasok na karakter.",
                "Hakbang 3 (Pagsala sa Collision): Kapag nagkapareho lamang ang hash ng window at pattern, doon lamang sinusuri ang bawat titik upang kumpirmahin ang totoong tugma."
            ]
        },

        brute_force: {
            title: "Brute Force String Matching",
            why: "Nahanap ng Brute Force ang {match_count} tugma gamit ang {comparisons} paghahambing. Bagamat simple at hindi nangangailangan ng karagdagang memory (O(1) space), paulit-ulit nitong sinusuri ang mga karakter kaya umaabot sa O(n · m) worst-case.",
            steps: [
                "Hakbang 1 (Sunod-sunod na Pagtapat): Sinusubukan ang bawat posisyon i mula 0 hanggang n - m sa teksto.",
                "Hakbang 2 (Paghahambing Bawat Titik): Sa bawat posisyon i, inihahambing ang bawat titik mula j = 0 hanggang m - 1.",
                "Hakbang 3 (Buong Ulit): Kapag may mismatch, uusad lang ng 1 karakter ang posisyon (i = i + 1) at uulitin muli ang pagsusuri mula simula ng pattern."
            ]
        },

        approximate: {
            title: "Approximate Matching (Levenshtein Distance)",
            why: "Nakakita ang approximate search ng {match_count} segment sa loob ng pinapayagang distansya na d ≤ {max_distance}. Tinatanggap nito ang typo, maling baybay, at genetic mutations gamit ang dynamic programming.",
            steps: [
                "Hakbang 1 (DP Cost Matrix): Gumawa ng (m + 1) × (k + 1) matrix kung saan ang bawat cell D[i, j] ay kumakatawan sa pinakamaliit na bilang ng edit operations.",
                "Hakbang 2 (Timbang ng Operasyon): Kinukwenta ang gastos ng insertion (1), deletion (1), at substitution (1 kung magkaiba, 0 kung magkatulad).",
                "Hakbang 3 (Pagsala sa Threshold): Kinuha ang lahat ng bahagi ng teksto kung saan ang huling Levenshtein distance ay pasok sa d ≤ {max_distance}."
            ]
        },

        huffman: {
            title: "Huffman Coding Compression",
            why: "Napaliit ng Huffman ang teksto mula {orig_bytes} bytes patungong {comp_bytes} bytes ({compression_ratio}% ratio, {space_savings}% natipid na espasyo). Ang mga laging lumalabas na titik ay binigyan ng maiikling binary bitcodes batay sa Shannon entropy.",
            steps: [
                "Hakbang 1 (Bilang ng Dalas): Binilang kung gaano kadalas lumitaw ang bawat isa sa {symbol_count} natatanging simbolo.",
                "Hakbang 2 (Min-Heap Priority Tree): Paulit-ulit na pinagsama ang dalawang simbolo na may pinakamababang dalas hanggang sa makabuo ng isang puno (tree).",
                "Hakbang 3 (Pagtatakda ng Prefix Codes): Nilakbay ang puno kung saan '0' sa kaliwang sanga at '1' sa kanang sanga. Tinitiyak nitong walang kodigo na magiging prefix ng iba.",
                "Hakbang 4 (100% Lossless Verification): Napatunayang naibalik nang buo at eksakto ang orihinal na teksto nang walang kahit isang byte na nawala."
            ]
        },

        rle: {
            title: "Run-Length Encoding (RLE)",
            why: "Piniga ng RLE ang data sa {runs_count} magkakasunod na run segments, kung saan ang pinakamahabang sunod-sunod na magkakaparehong titik ay {longest_run} karakter. Nagresulta sa {comp_bytes} bytes ({space_savings}% natipid). Napakabisa sa paulit-ulit na data; maaaring lumaki sa halo-halong teksto.",
            steps: [
                "Hakbang 1 (Pagsusuring Sunod-sunod): Binabasa ang teksto habang binibilang kung ilang beses naulit ang magkasunod na parehong karakter.",
                "Hakbang 2 (Pag-encode ng Token): Kapag nagbago ang karakter, inilalabas ang bilang kasunod ang karakter (hal. 'AAAAA' ay nagiging '5A').",
                "Hakbang 3 (Pagsusuri sa Decompression): Inulit ang proseso pabalik at napatunayang 100% tugma sa orihinal."
            ]
        },

        lzw: {
            title: "Lempel-Ziv-Welch (LZW) Compression",
            why: "Awtomatikong bumuo ang LZW ng diksyunaryo na may {dictionary_size} parirala at naglabas ng {codes_count} integer codes na may laking {bit_width}-bit. Nagbunga ng {comp_bytes} bytes ({space_savings}% natipid) nang hindi kailangang magpadala ng hiwalay na codebook.",
            steps: [
                "Hakbang 1 (Simula ng Diksyunaryo): Inihanda ang 256 basic ASCII characters sa diksyunaryo (mula index 0 hanggang 255).",
                "Hakbang 2 (Pag-ipon ng Parirala): Binabasa ang karakter sa buffer W. Kapag ang W + K ay wala pa sa diksyunaryo, inilalabas ang code para kay W at idinadagdag ang W + K bilang bagong entry.",
                "Hakbang 3 (Awtomatikong Pagkatuto): Natututunan ng algoritmo ang mga paulit-ulit na salita habang binabasa ang teksto.",
                "Hakbang 4 (Lossless Verification): Napatunayang na-decompress nang 100% wasto gamit ang parehong proseso ng diksyunaryo."
            ]
        },

        compression_compare_summary: "Paghahambing ng mga Paraan ng Compression:\n• Huffman Coding: Pinakamaganda sa natural na wika dahil binibigyan ng maikling bits ang madalas lumitaw na titik.\n• Run-Length Encoding (RLE): Pinakamahusay kung may mahahabang paulit-ulit na magkatabing karakter (hal. DNA sequences), ngunit lumalaki sa ordinaryong pangungusap.\n• LZW Compression: Epektibo sa mga teksto na may paulit-ulit na mga parirala dahil lumilikha ito ng sariling dynamic na diksyunaryo.",

        genetic_algorithm: {
            title: "Genetic Algorithm (GA) Metaheuristic",
            why: "In-optimize ng Genetic Algorithm ang 0/1 knapsack sa loob ng {generations} henerasyon gamit ang populasyon ng {population_size} chromosomes. Umunlad ang fitness mula {initial_fitness} patungong {final_fitness}, na umabot sa {optimality_ratio}% ng DP theoretical optimum.",
            steps: [
                "Hakbang 1 (Pagsisimula ng Populasyon): Gumawa ng {population_size} random binary chromosomes na kumakatawan sa mga mapipiling gamit.",
                "Hakbang 2 (Pagsukat ng Fitness): Sinukat ang kabuuang halaga ng gamit para sa bawat chromosome, at binigyan ng parusa kapag lumagpas sa capacity na {capacity}.",
                "Hakbang 3 (Selection at Crossover): Gumamit ng tournament selection upang piliin ang magagaling na magulang at nagsagawa ng single-point crossover na may probabilidad na {cx_rate}.",
                "Hakbang 4 (Mutation at Elitism): Nagpalit ng random bits gamit ang mutation rate na {mut_rate} upang mapanatili ang pagkakaiba-iba habang pinapanatili ang pinakamagandang solusyon."
            ]
        },

        knapsack_dp_greedy: {
            title: "0/1 Knapsack: Dynamic Programming vs Greedy Heuristic",
            why: "Tiniyak ng Dynamic Programming ang eksaktong pinakamataas na halaga ({dp_val}) sa loob ng O(n · W) time. Ang Greedy heuristic naman ay nag-sort ayon sa value-to-weight ratio upang makuha ang {greedy_val} sa O(n log n) time ({optimality_ratio}% ng eksaktong solusyon).",
            steps: [
                "Hakbang 1 (DP Optimal Substructure): Bumuo ng 2D table DP[i][w] kung saan nakatala ang pinakamataas na halaga gamit ang unang i gamit sa limitasyong w.",
                "Hakbang 2 (DP Formula): DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i]] + value[i]), na nagbibigay ng garantisadong eksaktong sagot.",
                "Hakbang 3 (Greedy Ratio Sort): Inayos ang mga gamit mula pinakamataas na ratio (Halaga / Timbang) at kinuha ang mga ito hangga't may natitira pang espasyo."
            ]
        },

        parallel_search: {
            title: "Parallel Multi-Threaded Pattern Search",
            why: "Ang multi-threaded search gamit ang {workers} worker threads ay nagtala ng {speedup}x pabilis ({parallel_time} µs parallel laban sa {seq_time} µs sequential). Ang overlap safety margin ay sumisiguro na walang makakaligtaang pattern sa pagitan ng mga partitions.",
            steps: [
                "Hakbang 1 (Paghahati ng Teksto): Hinati ang {char_count} karakter sa {workers} pantay na tipak para sa sabay-sabay na worker threads.",
                "Hakbang 2 (Boundary Overlap Margin): Pinalawig ang dulo ng bawat tipak ng (m - 1) = {overlap} karakter upang mahuli ang mga pattern na nakapatong sa boundary.",
                "Hakbang 3 (Sabay-sabay na Paghahanap): Sabay-sabay na pinatakbo ng mga worker thread ang KMP algorithm sa kani-kanilang bahagi.",
                "Hakbang 4 (Pagsasama at Pagtanggal ng Doble): Pinagsama ang mga nahanap na tugma at inalis ang anumang naulit sa overlap zone."
            ]
        },

        randomized_quicksort: {
            title: "Randomized QuickSort",
            why: "Inayos ng Randomized QuickSort ang {count} tokens sa loob ng {time_us} µs gamit ang {comparisons} paghahambing sa lalim ng recursion na {depth}. Ang random pivot ay nag-aalis sa panganib ng O(n²) worst-case sa nakaayos nang data, kaya nananatiling O(n log n).",
            steps: [
                "Hakbang 1 (Random Pivot Selection): Sa bawat sub-array, pumipili ng random na index at ipinagpapalit ito sa dulo.",
                "Hakbang 2 (Paghihiwalay / Partitioning): Inaayos ang mga elemento upang ang lahat ng mas maliit sa pivot ay mapunta sa kaliwa, at ang mas malaki ay sa kanan.",
                "Hakbang 3 (Divide & Conquer): Paulit-ulit na inaayos ang kaliwa at kanang bahagi nang hiwalay."
            ]
        },

        randomized_quickselect: {
            title: "Randomized QuickSelect (k-th Order Statistic)",
            why: "Nahanap ng QuickSelect ang ika-k={k} na elemento ('{element}') sa inaasahang linear time O(n) sa loob ng {time_us} µs. Dahil isa lamang sa dalawang bahagi ang pinapasok nito, doble ang bilis nito kaysa buong pag-sort.",
            steps: [
                "Hakbang 1 (Random Pivot): Pumipili ng random pivot upang hatiin ang listahan sa mas maliit at mas malaki.",
                "Hakbang 2 (Pagsusuri sa Index): Kung ang pivot ay natapat eksakto sa index k, agad itong ibinabalik bilang sagot.",
                "Hakbang 3 (Isang Sangay Lamang): Kung k < pivot index, pumupunta lamang sa kaliwa; kung hindi, sa kanan lamang, kaya mabilis na nahahati ang trabaho."
            ]
        },

        astar_pathfinding: {
            title: "Weighted A* Pathfinding",
            why: "Nahanap ng A* ang pinakamaikling ruta mula '{start}' patungong '{goal}' na may kabuuang gastos na {cost}, sa pamamagitan ng pagbisita sa {visited} nodes lamang. Sa paggamit ng f(n) = g(n) + h(n), hindi na nito sinasayang ang oras sa mga maling direksyon.",
            steps: [
                "Hakbang 1 (Priority Evaluation): Gumagamit ng open priority queue na nakaayos batay sa f(n) = g(n) + h(n).",
                "Hakbang 2 (Edge Relaxation): Sinusuri ang mga karatig-node at ina-update ang g-score kapag nakakita ng mas murang daan.",
                "Hakbang 3 (Pagtatapos sa Destinasyon): Sa oras na maabot ang goal node '{goal}', ginagarantiyahan ang pinakamainam na ruta at binuo ito gamit ang parent pointers."
            ]
        },

        caesar_cipher: {
            title: "Modulo-10 Caesar Cipher Transformation",
            why: "Ikinukubli ang mga numerical edge weights gamit ang modular arithmetic formula: E(w) = (w + shift) mod 10 gamit ang shift = {shift}. Pinoprotektahan ang mga numero habang pinapanatili ang ayos ng desimal.",
            steps: [
                "Hakbang 1 (Pagsusuri ng Tambilang): Inihihiwalay ang mga numero habang pinananatili ang mga tuldok at bantas.",
                "Hakbang 2 (Modular Shift): Para sa bawat digit d, kinukwenta ang d' = (d + {shift}) mod 10.",
                "Hakbang 3 (Pagbuo ng Ulat): Inilalabas ang mga naka-encrypt na timbang sa nada-download na TXT file para sa ligtas na pagpapadala."
            ]
        }
    },

    // ==========================================
    // CEBUANO / BISAYA (Boholano Mother Tongue)
    // ==========================================
    ceb: {
        pattern_comparison_summary: "Katingbanan sa Pagsusi: Ang KMP ({kmp_comps} comparisons) ug Boyer-Moore ({bm_comps} comparisons) mas paspas kaayo kaysa Brute Force ({bf_comps} comparisons) tungod kay naggamit sila og precomputed heuristic tables aron dili na mobalik-balik sa pagtandi sa mga letra nga daan nang motakdo.",

        kmp: {
            title: "Knuth-Morris-Pratt (KMP) Algorithm",
            why: "Nakit-an sa KMP ang {match_count} ka motakdo sulod sa strictly linear O(n + m) time gamit ang {comparisons} ka pagtandi sa letra. Pwerteng paspasa kay dili na man mobalik atras ang pointer sa teksto.",
            steps: [
                "Lakang 1 (Precomputation): Gitukod ang Longest Proper Prefix which is also a Suffix (LPS) array para sa pattern nga '{pattern}'. LPS = [{lps}].",
                "Lakang 2 (Pagsusi Paabante): Gisusi ang mga letra gikan sa wala padulong sa tuo. Kon motakdo, moabante ang duha ka pointers.",
                "Lakang 3 (Paglayat sa Mismatch): Kon naay dili motakdo sa pattern index j, DILI mobalik atras ang text pointer. Hinunoa, ibutang ang j = LPS[j - 1] aron magpadayon gamit ang nahaunang prefix nga nitakdo na."
            ]
        },

        boyer_moore: {
            title: "Boyer-Moore (Bad Character Heuristic)",
            why: "Nakit-an sa Boyer-Moore ang {match_count} ka motakdo gamit lamang ang {comparisons} ka pagtandi. Tungod kay magsusi kini gikan sa tuo padulong sa wala sa matag bintana, molayat kini og hangtod m={pattern_len} ka letra sa usa lang ka lakang, hinungdan sa sublinear speed nga Ω(n / m).",
            steps: [
                "Lakang 1 (Shift Table): Giandam ang Bad Character table diin nakalista ang kinauwahing posisyon sa matag letra sa pattern.",
                "Lakang 2 (Pagsusi Tuo-Padulong-Wala): Itapad ang pattern sa teksto ug susihon ang mga letra sugod sa tumoy sa pattern padulong sa unahan.",
                "Lakang 3 (Paspas nga Paglayat): Kon naay mismatch sa letra nga 'c', i-irog ang pattern aron motakdo ang 'c' sa uwahing posisyon niini sa pattern. Kon wala ang 'c', laktaran dayon ang tibuok bintana sa usa lang ka lakang."
            ]
        },

        rabin_karp: {
            title: "Rabin-Karp (Rolling Polynomial Hash)",
            why: "Nakit-an sa Rabin-Karp ang {match_count} ka motakdo gamit ang {comparisons} ka pagtandi ug nakatala og {spurious_hits} ka spurious hash collision(s). Gisusi niini ang matag bintana sa gikusgong O(1) arithmetic operations gamit ang rolling hash formula.",
            steps: [
                "Lakang 1 (Kuwenta sa Hash): Gikuwenta ang polynomial hash value ({pattern_hash}) sa pattern nga '{pattern}' gamit ang base 256 ug prime modulo 1,000,003.",
                "Lakang 2 (Rolling Update): Samtang nag-irog ang bintana sa teksto, kuwentahon ang bag-ong hash sa O(1) pinaagi sa pagkuha sa migawas nga letra ug pagdugang sa bag-ong misulod.",
                "Lakang 3 (Pagsala sa Collision): Kon magkapareho lamang ang hash sa bintana ug sa pattern, diha pa susihon ang tagsa-tagsa ka letra aron masiguro ang tinuod nga kaparehas."
            ]
        },

        brute_force: {
            title: "Brute Force String Matching",
            why: "Nakit-an sa Brute Force ang {match_count} ka motakdo gamit ang {comparisons} ka pagtandi. Bisan tuod simple ug walay gikinahanglang dugang memory (O(1) space), balik-balik niining gitandi ang mga letra maong moabot kini sa O(n · m) worst-case.",
            steps: [
                "Lakang 1 (Sunod-sunod nga Pagsulay): Sulayan ang matag posisyon i gikan sa 0 hangtod n - m sa teksto.",
                "Lakang 2 (Pagtandi sa Matag Letra): Sa matag posisyon i, itandi ang matag letra gikan sa j = 0 hangtod m - 1.",
                "Lakang 3 (Balik Sugod): Kon naay mismatch, moabante lang og 1 ka letra ang posisyon (i = i + 1) ug sublion na sab ang pagsusi sugod sa sinugdanan sa pattern."
            ]
        },

        approximate: {
            title: "Approximate Matching (Levenshtein Distance)",
            why: "Nakit-an sa approximate search ang {match_count} ka bahin sa teksto sulod sa gitugot nga distansya nga d ≤ {max_distance}. Madawat niini ang mga sayop sa tipo, sayop nga spelling, ug mutation sa genes gamit ang dynamic programming.",
            steps: [
                "Lakang 1 (DP Cost Matrix): Naghimo og (m + 1) × (k + 1) matrix diin ang matag cell D[i, j] nagrepresentar sa pinakagamay nga mga pag-usab.",
                "Lakang 2 (Gasto sa Operasyon): Gikuwenta ang gasto sa insertion (1), deletion (1), ug substitution (1 kon managlahi, 0 kon managsama).",
                "Lakang 3 (Pagsala sa Threshold): Gikuha ang tanang bahin sa teksto diin ang Levenshtein distance dili molapas sa d ≤ {max_distance}."
            ]
        },

        huffman: {
            title: "Huffman Coding Compression",
            why: "Nipagamay ang Huffman sa teksto gikan sa {orig_bytes} bytes ngadto sa {comp_bytes} bytes ({compression_ratio}% ratio, {space_savings}% na-save nga espasyo). Ang mga letra nga pirmi mogawas gihatagan og tag-mubo nga binary bitcodes subay sa Shannon entropy.",
            steps: [
                "Lakang 1 (Pag-ihap sa Frequencies): Giihap kon kapila nitungha ang matag usa sa {symbol_count} ka talagsaong simbolo.",
                "Lakang 2 (Min-Heap Priority Tree): Balik-balik nga gihiusa ang duha ka simbolo nga kinagamyan og frequency hangtod naporma ang usa ka kahoy (tree).",
                "Lakang 3 (Paghatag og Prefix Codes): Gisubay ang kahoy diin '0' sa wala nga sanga ug '1' sa tuo nga sanga. Nagsiguro kini nga walay kodigo nga mahimong prefix sa lain.",
                "Lakang 4 (100% Lossless nga Pagpamatuod): Napamatud-an nga nabalik sa hingpit ang orihinal nga teksto nga walay bisan usa ka byte nga nawala."
            ]
        },

        rle: {
            title: "Run-Length Encoding (RLE)",
            why: "Gipuga sa RLE ang data ngadto sa {runs_count} ka magkasunod nga run segments, diin ang pinakataas nga sunod-sunod nga parehong letra maoy {longest_run} ka karakter. Miresulta sa {comp_bytes} bytes ({space_savings}% na-save). Epektibo kaayo sa balik-balik nga data; apan modako sa ordinaryong sinulat.",
            steps: [
                "Lakang 1 (Pagsusi nga Pasunod): Gibasa ang teksto samtang giihap kon kapila nagbalik-balik ang magkasunod nga parehong letra.",
                "Lakang 2 (Pag-encode sa Token): Kon mausab ang letra, ipagawas ang ihap sundan sa maong letra (sama sa 'AAAAA' mahimong '5A').",
                "Lakang 3 (Pagsusi sa Decompression): Gi-reconstruct pabalik ug napamatud-an nga 100% motakdo sa orihinal."
            ]
        },

        lzw: {
            title: "Lempel-Ziv-Welch (LZW) Compression",
            why: "Nakahimo ang LZW og dynamic nga diksyunaryo nga may {dictionary_size} ka mga pulong ug nagpagawas og {codes_count} ka integer codes nga may gilapdon nga {bit_width}-bit. Miresulta sa {comp_bytes} bytes ({space_savings}% na-save) nga wala na kinahanglana ang pagpadala og lahi nga codebook.",
            steps: [
                "Lakang 1 (Sinugdanan sa Diksyunaryo): Giandam daan ang 256 basic ASCII characters sa diksyunaryo (gikan index 0 hangtod 255).",
                "Lakang 2 (Pagtigom sa mga Pulong): Basahon ang karakter sa buffer W. Kon ang W + K wala pa sa diksyunaryo, ipagawas ang code alang kang W ug idugang ang W + K isip bag-ong entry.",
                "Lakang 3 (Awtomatikong Pagkat-on): Makat-onan sa algorithm ang mga balik-balik nga pulong samtang nagbasa sa teksto.",
                "Lakang 4 (Lossless nga Pagpamatuod): Napamatud-an nga na-decompress sa 100% nga katukma gamit ang parehong proseso sa diksyunaryo."
            ]
        },

        compression_compare_summary: "Pagtandi sa mga Pamaagi sa Compression:\n• Huffman Coding: Labing maayo sa natural nga sinulat tungod kay naghatag kini og mugbong bits sa mga letra nga pirmi gamiton.\n• Run-Length Encoding (RLE): Labing kusog kon naay tag-as nga balik-balik nga magkatapad nga letra (sama sa DNA), apan modako sa sagol-sagol nga teksto.\n• LZW Compression: Epektibo kaayo sa teksto nga adunay balik-balik nga mga hugpong sa pulong pinaagi sa pagtukod og dynamic nga diksyunaryo.",

        genetic_algorithm: {
            title: "Genetic Algorithm (GA) Metaheuristic",
            why: "Gi-optimize sa Genetic Algorithm ang 0/1 knapsack sulod sa {generations} ka henerasyon gamit ang populasyon sa {population_size} ka chromosomes. Niuswag ang fitness gikan {initial_fitness} ngadto sa {final_fitness}, nga niabot sa {optimality_ratio}% sa theoretical DP global optimum.",
            steps: [
                "Lakang 1 (Sinugdanan sa Populasyon): Nagmugna og {population_size} ka random binary chromosomes nga nagrepresentar sa mga mapiling butang.",
                "Lakang 2 (Pagsukod sa Fitness): Gikalkula ang kinatibuk-ang bili sa butang alang sa matag chromosome, ug gipamulta kon molapas sa kapasidad nga {capacity}.",
                "Lakang 3 (Selection ug Crossover): Gigamit ang tournament selection aron pilion ang maayong mga ginikanan ug gipahigayon ang single-point crossover nga may probabilidad nga {cx_rate}.",
                "Lakang 4 (Mutation ug Elitism): Nag-usab og random bits gamit ang mutation rate nga {mut_rate} aron mamentinar ang kalainan samtang giampingan ang kinamaayohang solusyon (elitism)."
            ]
        },

        knapsack_dp_greedy: {
            title: "0/1 Knapsack: Dynamic Programming vs Greedy Heuristic",
            why: "Gipasalig sa Dynamic Programming ang eksaktong kinatas-ang bili ({dp_val}) sulod sa O(n · W) time. Ang Greedy heuristic nisort subay sa value-to-weight ratio aron makab-ot ang {greedy_val} sulod sa O(n log n) time ({optimality_ratio}% sa eksaktong solusyon).",
            steps: [
                "Lakang 1 (DP Optimal Substructure): Naghimo og 2D table DP[i][w] diin nakatala ang kinatas-ang bili gamit ang unang i ka butang sa limitasyon nga w.",
                "Lakang 2 (DP Formula): DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i]] + value[i]), nga naghatag og garantisadong eksaktong tubag.",
                "Lakang 3 (Greedy Ratio Sort): Gihan-ay ang mga butang gikan sa kinatas-ang ratio (Bili / Timbang) ug gikuha ang mga butang samtang duna pay nahabiling luna."
            ]
        },

        parallel_search: {
            title: "Parallel Multi-Threaded Pattern Search",
            why: "Ang multi-threaded search gamit ang {workers} worker threads nakatala og {speedup}x nga pagpaspas ({parallel_time} µs parallel batok {seq_time} µs sequential). Ang overlap safety margin nagsiguro nga walay malabyan nga pattern taliwala sa mga tipak.",
            steps: [
                "Lakang 1 (Pagbahin sa Teksto): Gibahin ang {char_count} ka letra ngadto sa {workers} ka managsamang tipak alang sa kadungan nga worker threads.",
                "Lakang 2 (Boundary Overlap Margin): Gilapdan ang tumoy sa matag tipak og (m - 1) = {overlap} ka letra aron madakpan ang mga pattern nga anaa sa utlanan.",
                "Lakang 3 (Dungan nga Pagpangita): Dungan nga gipadagan sa mga worker thread ang KMP algorithm sa tagsa-tagsa nila ka bahin sa memory.",
                "Lakang 4 (Pagtigom ug Pagtangtang sa Doble): Gitigom ang tanang nakit-ang posisyon ug gikuha ang bisan unsang nadoble sa overlap zone."
            ]
        },

        randomized_quicksort: {
            title: "Randomized QuickSort",
            why: "Gihan-ay sa Randomized QuickSort ang {count} ka tokens sulod sa {time_us} µs gamit ang {comparisons} ka pagtandi sa kinataliwad-ang giladmon sa recursion nga {depth}. Ang random pivot nagwagtang sa kapeligrohan sa O(n²) worst-case sa daan nang gihan-ay nga data, maong sigurado ang O(n log n).",
            steps: [
                "Lakang 1 (Random Pivot Selection): Sa matag sub-array, mopili og random nga index ug ibaylo kini ngadto sa tumoy.",
                "Lakang 2 (Pagbahin / Partitioning): Ihan-ay ang mga elemento aron ang tanang mas gamay sa pivot moadto sa wala, ug ang mas dako moadto sa tuo.",
                "Lakang 3 (Divide & Conquer): Balik-balik nga han-ayon ang wala ug tuo nga bahin nga independente."
            ]
        },

        randomized_quickselect: {
            title: "Randomized QuickSelect (k-th Order Statistic)",
            why: "Nakit-an sa QuickSelect ang ika-k={k} nga elemento ('{element}') sa gilaumang linear time O(n) sulod sa {time_us} µs. Tungod kay usa ra sa duha ka bahin ang sudlan niini, doble ang kapaspason niini kaysa tibuok paghan-ay.",
            steps: [
                "Lakang 1 (Random Pivot): Mopili og random pivot aron bahinon ang listahan sa mas gamay ug mas dako.",
                "Lakang 2 (Pagsusi sa Index): Kon ang pivot natunong gayod sa index k, ihatag dayon kini isip tubag.",
                "Lakang 3 (Usa ra ka Sangang Sudlan): Kon k < pivot index, mosulod lamang sa wala; kon dili, sa tuo lamang, hinungdan nga tungaon dayon ang buluhaton."
            ]
        },

        astar_pathfinding: {
            title: "Weighted A* Pathfinding",
            why: "Nakit-an sa A* ang pinakamubo nga ruta gikan '{start}' padulong '{goal}' nga may kinatibuk-ang gasto nga {cost}, pinaagi sa pagbisita sa {visited} ra ka nodes. Gamit ang pormulang f(n) = g(n) + h(n), dili na niini usikan ang panahon sa mga sayop nga direksyon.",
            steps: [
                "Lakang 1 (Priority Evaluation): Naggamit og open priority queue nga gihan-ay subay sa f(n) = g(n) + h(n).",
                "Lakang 2 (Edge Relaxation): Gisusi ang mga kasikbit nga node ug gi-update ang g-score kon makakita og mas barato nga agianan.",
                "Lakang 3 (Pagtapos sa Tumong): Sa higayon nga makuha ang goal node '{goal}', sigurado na ang kinamaayohang ruta ug gitukod kini pinaagi sa parent pointers."
            ]
        },

        caesar_cipher: {
            title: "Modulo-10 Caesar Cipher Transformation",
            why: "Gisulod sa kriptograpiya ang mga numerical edge weights gamit ang modular arithmetic formula: E(w) = (w + shift) mod 10 gamit ang shift = {shift}. Giprotektahan ang mga numero samtang giampingan ang hitsura sa decimal.",
            steps: [
                "Lakang 1 (Pagsusi sa Numero): Gilain ang mga numero samtang giampingan ang mga tuldok ug punctuation.",
                "Lakang 2 (Modular Shift): Alang sa matag digit d, kalkulahon ang d' = (d + {shift}) mod 10.",
                "Lakang 3 (Paghimo sa Report): Gipagawas ang mga encrypted nga gibug-aton sa ma-download nga TXT file alang sa luwas nga pagpadala."
            ]
        }
    }
};

/**
 * Helper to interpolate template strings like {match_count} with data
 */
window.formatI18nText = function(str, params) {
    if (!str) return '';
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
    });
};

/**
 * Retrieves the currently active language code ('en', 'tl', or 'ceb')
 */
window.getCurrentLanguage = function() {
    return localStorage.getItem('graphcrypt_lang') || 'en';
};

/**
 * Sets the active language and notifies all listeners
 */
window.setLanguage = function(langCode) {
    if (!window.I18N_EXPLANATIONS[langCode]) {
        langCode = 'en';
    }
    localStorage.setItem('graphcrypt_lang', langCode);
    
    // Update active state on any switcher pills in the DOM
    document.querySelectorAll('.lang-pill').forEach(btn => {
        if (btn.dataset.lang === langCode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Dispatch global event for views to re-render explanations
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));
};
