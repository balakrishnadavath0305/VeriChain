// Gemini AI wrapper for VeriChain
import * as XLSX from 'xlsx';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini(prompt, retries = 3) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to frontend/.env');
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
            })
        });

        if (res.status === 429) {
            const waits = [5000, 15000, 30000];
            const wait = waits[attempt] || 30000;
            console.warn(`Gemini rate limited. Retrying in ${wait / 1000}s...`);
            await new Promise(r => setTimeout(r, wait));
            continue;
        }

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err?.error?.message || `Gemini API error (${res.status})`);
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    throw new Error('AI is busy right now. Please wait a moment and try again.');
}

// ─── MIME detection from file extension ──────────────────────────────────────
const EXT_MIME = {
    // Code
    js: 'text/javascript', ts: 'text/typescript', jsx: 'text/javascript',
    tsx: 'text/typescript', py: 'text/x-python', java: 'text/x-java',
    cpp: 'text/x-c++src', c: 'text/x-csrc', go: 'text/x-go',
    rs: 'text/x-rust', php: 'text/x-php', rb: 'text/x-ruby',
    cs: 'text/x-csharp', swift: 'text/x-swift', kt: 'text/x-kotlin',
    html: 'text/html', css: 'text/css', json: 'application/json',
    xml: 'application/xml', sh: 'application/x-sh', sql: 'application/sql',
    // Documents
    pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', txt: 'text/plain', md: 'text/markdown',
    csv: 'text/csv',
    // Images
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
    // Video/Audio
    mp4: 'video/mp4', avi: 'video/avi', mov: 'video/quicktime',
    mp3: 'audio/mpeg', wav: 'audio/wav',
    // Archives
    zip: 'application/zip', tar: 'application/x-tar', gz: 'application/gzip',
};

export function detectMime(files) {
    const arr = Array.from(files);
    if (arr.length > 1) return 'application/folder';

    const file = arr[0];
    if (file.type && file.type !== 'application/octet-stream') return file.type;

    const ext = file.name.split('.').pop()?.toLowerCase();
    return EXT_MIME[ext] || file.type || 'application/octet-stream';
}

// ─── Read text content from uploaded files ───────────────────────────────────
// Reads up to `maxChars` from text-like files for AI context
export async function readFileContent(files, maxChars = 4000) {
    const textExtensions = [
        'txt', 'md', 'py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css',
        'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 'cs', 'json',
        'xml', 'sql', 'sh', 'csv', 'yaml', 'yml', 'toml', 'ini', 'conf'
    ];

    const fileArr = Array.from(files);
    const textFiles = fileArr.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return textExtensions.includes(ext) && f.size < 500_000; // max 500KB per file
    });

    if (textFiles.length === 0) return null;

    // Read up to 3 text files
    const contents = await Promise.all(
        textFiles.slice(0, 3).map(async file => {
            try {
                const text = await file.text();
                return `\n--- ${file.name} ---\n${text.slice(0, Math.floor(maxChars / 3))}`;
            } catch {
                return null;
            }
        })
    );

    const combined = contents.filter(Boolean).join('\n').slice(0, maxChars);
    return combined || null;
}

// ─── Feature 1: Classify uploaded documents ──────────────────────────────────
export async function classifyDocuments(files) {
    const fileArr = Array.from(files);

    // Build rich extension summary for better accuracy
    const extCounts = {};
    fileArr.forEach(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || 'unknown';
        extCounts[ext] = (extCounts[ext] || 0) + 1;
    });
    const extSummary = Object.entries(extCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([ext, count]) => `.${ext} (${count})`)
        .join(', ');

    const fileList = fileArr.slice(0, 10)
        .map(f => f.name)
        .join(', ');

    const prompt = `You are a file classification expert. Analyze these uploaded project files and return ONLY valid JSON.

File count: ${fileArr.length}
File extensions: ${extSummary}
Sample filenames: ${fileList}

Respond with ONLY this JSON (no markdown, no explanation):
{"category":"<one of: code|academic|design|media|document|mixed>","mime":"<single best MIME type for this project>","suggestedTitle":"<3-6 word professional project title>","theme":"<one of: academic|corporate|creative|technical>","confidence":<integer 0-100>}

Classification rules (be DECISIVE, pick the BEST match):
- category=code: .js/.py/.java/.ts/.cpp/.go/.rs files dominate
- category=academic: .pdf/.docx + research/thesis/paper filenames
- category=design: .fig/.psd/.ai/.svg/.sketch files
- category=media: .mp4/.jpg/.png/.mp3 dominate
- category=document: .pdf/.docx/.xlsx dominate (no code)
- category=mixed: truly equal mix

- theme=technical: code, engineering, software
- theme=academic: research, papers, study materials
- theme=creative: design, media, art
- theme=corporate: business reports, financial docs, presentations

- mime: best single MIME for the dominant file type
- confidence: 90+ if >70% of files are same type, 70-89 if clear majority, below 70 only if truly mixed`;

    const raw = await callGemini(prompt);
    try {
        const json = raw.replace(/```json|```/g, '').trim();
        return JSON.parse(json);
    } catch {
        return { category: 'document', mime: 'application/octet-stream', suggestedTitle: '', theme: 'corporate', confidence: 50 };
    }
}

// ─── Feature 2: Generate professional certificate description ─────────────────
export async function generateDescription(projectTitle, files, fileContent = null) {
    const fileArr = Array.from(files);
    const fileInfo = fileArr.slice(0, 5).map(f => f.name).join(', ');

    const contentSection = fileContent
        ? `\nFile content preview:\n${fileContent.slice(0, 800)}`
        : '';

    const prompt = `Write a professional 2-sentence certificate description for a blockchain certificate of authenticity.
Project: "${projectTitle}"
Files: ${fileInfo}${contentSection}

Requirements:
- Formal, professional tone
- Mention blockchain verification
- Max 60 words
- No first person, no quotes
- Return ONLY the description text`;

    return await callGemini(prompt);
}

// ─── Feature 3: Assess fraud risk ────────────────────────────────────────────
export function assessFraudRisk(files, projectTitle) {
    const risks = [];
    let score = 0;
    const fileArr = Array.from(files);

    const emptyFiles = fileArr.filter(f => f.size === 0);
    if (emptyFiles.length > 0) { risks.push(`${emptyFiles.length} empty file(s) detected`); score += 40; }

    const genericTitles = ['test', 'untitled', 'project files', 'new folder', 'document', 'file'];
    if (!projectTitle || genericTitles.some(t => projectTitle.toLowerCase().includes(t))) {
        risks.push('Generic or missing project title'); score += 20;
    }

    if (fileArr.length > 50) { risks.push(`Large file count (${fileArr.length} files)`); score += 15; }

    const names = fileArr.map(f => f.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length > 0) { risks.push('Duplicate filenames detected'); score += 25; }

    const execExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1'];
    if (fileArr.some(f => execExtensions.some(ext => f.name.toLowerCase().endsWith(ext)))) {
        risks.push('Executable files detected'); score += 30;
    }

    if (score === 0) risks.push('No suspicious patterns detected');
    const level = score === 0 ? 'low' : score <= 30 ? 'medium' : 'high';
    return { level, score: Math.min(score, 100), reasons: risks };
}

// ─── Fetch file content from IPFS (for Verify page) ─────────────────────────
// Returns readable text content or a clear description for the AI
export async function fetchIPFSContent(cid, maxChars = 4000) {
    // Skip fake/mock/private CIDs
    if (!cid || cid === 'mock' || cid === 'private') return null;
    if (/^bafybeig[a-z0-9]{5,10}$/.test(cid)) return null;

    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`
    ];

    for (const url of gateways) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (!res.ok) continue;

            const contentType = res.headers.get('content-type') || '';

            // ─ Plain text / JSON / CSV / code files ─ return raw content
            if (contentType.includes('text') || contentType.includes('json') ||
                contentType.includes('javascript') || contentType.includes('xml') ||
                contentType.includes('csv')) {
                const text = await res.text();
                return text.slice(0, maxChars);
            }

            // ─ Excel / Spreadsheet (XLSX, XLS, ODS) ─ parse with SheetJS ─
            const isSpreadsheet = (
                contentType.includes('spreadsheet') ||
                contentType.includes('excel') ||
                contentType.includes('vnd.ms-excel') ||
                contentType.includes('vnd.openxmlformats')
            );
            if (isSpreadsheet) {
                try {
                    const arrayBuffer = await res.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    let output = `[Excel Workbook — ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}]\n\n`;
                    // Convert each sheet to CSV text (up to 3 sheets)
                    workbook.SheetNames.slice(0, 3).forEach(name => {
                        const sheet = workbook.Sheets[name];
                        const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
                        output += `=== Sheet: ${name} ===\n${csv.slice(0, 1200)}\n\n`;
                    });
                    return output.slice(0, maxChars);
                } catch {
                    return `[Excel file — could not parse content]`;
                }
            }

            // ─ PDF ─
            if (contentType.includes('pdf')) {
                return `[PDF document stored on IPFS. Content is visual/formatted — cannot extract text in browser. Reason from the project title and certificate metadata.]`;
            }

            // ─ Images ─
            if (contentType.includes('image/')) {
                return `[Image file (${contentType}) stored on IPFS. Reason from the project title and certificate metadata.]`;
            }

            // ─ Other binary ─
            return `[Binary file (${contentType}) stored on IPFS. Reason from the project title and MIME type.]`;
        } catch {
            continue; // try next gateway
        }
    }
    return null; // all gateways failed or timed out
}

// ─── Feature 4 (Verify page): AI chat about a certificate ────────────────────
export async function askAboutCertificate(question, certificate, ipfsContent = null) {
    const certContext = `Certificate on Blockchain:
- Owner wallet: ${certificate[0]}
- File hash (SHA-256): ${certificate[1]}
- IPFS CID: ${certificate[2]}
- Registered: ${new Date(Number(certificate[3]) * 1000).toLocaleString()}
- Project title: ${certificate[4]}
- File type (MIME): ${certificate[5]}`;

    let contentSection;
    if (!ipfsContent) {
        contentSection = `\n(File is stored on IPFS at CID ${certificate[2]} and is accessible. Content fetch timed out or is still propagating — reason from the certificate metadata above.)`;
    } else {
        contentSection = `\nFile content / data from IPFS:\n${ipfsContent}`;
    }

    const prompt = `You are a blockchain certificate verification assistant for VeriChain.
Answer the user's question using the certificate data and file content below.

${certContext}${contentSection}

Question: "${question}"

Answer helpfully in 2-4 sentences. Be factual. The file IS on IPFS and IS accessible — never say IPFS is not configured. If file content is available, use it to answer specifically.`;

    return await callGemini(prompt);
}

// ─── Feature 5 (Create page): AI chat about the actual uploaded files ─────────
export async function askAboutFiles(question, files, fileContent, projectTitle) {
    const fileArr = Array.from(files);
    const fileSummary = fileArr.slice(0, 10).map(f => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join(', ');

    const contentSection = fileContent
        ? `\nFile content preview:\n${fileContent}`
        : '\n(Binary or non-text files — content not readable)';

    const prompt = `You are an AI assistant helping a user understand their uploaded project files before certifying them on the blockchain.

Project: "${projectTitle || 'Unnamed project'}"
Files (${fileArr.length} total): ${fileSummary}
${contentSection}

User question: "${question}"

Answer helpfully in 2-4 sentences based on the files and content above. If content isn't available, reason from filenames and types.`;

    return await callGemini(prompt);
}
