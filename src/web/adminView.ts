export function renderAdminHTML(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Pengelola Data - SAPA BPS Kab. Bangka</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
            background-color: #0b1329; 
            color: #f8fafc; 
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }
        
        .glass-card { 
            background: #1e293b; 
            background: rgba(30, 41, 59, 0.95); 
            border: 1px solid rgba(255, 255, 255, 0.08); 
            transform: translateZ(0);
            backface-visibility: hidden;
            contain: content;
        }
        
        /* Tampilan Tabel Gelap: Teks tebal harus PUTIH TERANG */
        #faqTableBody strong {
            color: #ffffff !important;
            font-weight: 700 !important;
        }
        #faqTableBody em {
            color: #93c5fd !important;
        }

        /* Tampilan Balon WhatsApp Terang: Teks tebal harus HITAM PEKAT */
        .wa-bg { 
            background-color: #efeae2; 
            background-image: radial-gradient(#d1d7db 1px, transparent 1px); 
            background-size: 16px 16px; 
            contain: paint;
        }
        .wa-bubble { 
            background-color: #ffffff; 
            color: #111b21; 
            border-radius: 12px 12px 12px 2px; 
            transform: translateZ(0);
        }
        .wa-bubble strong {
            color: #0f172a !important;
            font-weight: 700 !important;
        }
        .wa-bubble em {
            color: #334155 !important;
        }

        html { scroll-behavior: smooth; }
        
        input, textarea {
            transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }
    </style>
</head>
<body class="min-h-screen p-3 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto space-y-6">
        
        <!-- HEADER UTAMA -->
        <header class="glass-card rounded-2xl p-5 sm:p-7 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                    📊
                </div>
                <div>
                    <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Panel Kelola Data Chatbot BPS
                    </h1>
                    <p class="text-slate-400 text-sm sm:text-base mt-0.5">
                        Badan Pusat Statistik Kabupaten Bangka • Ubah data semudah mengetik pesan
                    </p>
                </div>
            </div>
            <div class="flex flex-wrap gap-3 w-full md:w-auto">
                <button onclick="openModal()" class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-5 py-3 rounded-xl font-bold text-base shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2">
                    <span class="text-xl">➕</span> Tambah Data Baru
                </button>
                <a href="/api/download-csv" class="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                    <span class="text-lg">📥</span> Unduh Cadangan CSV
                </a>
            </div>
        </header>

        <!-- KOTAK STATUS & PANDUAN -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl font-bold">
                    📋
                </div>
                <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Topik Resmi</p>
                    <p id="totalCount" class="text-2xl font-extrabold text-blue-400 mt-0.5">0</p>
                </div>
            </div>

            <div class="glass-card rounded-2xl p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl font-bold">
                    🟢
                </div>
                <div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Chatbot</p>
                    <p class="text-base font-bold text-emerald-400 mt-0.5">Siap Melayani WhatsApp</p>
                </div>
            </div>

            <div class="glass-card rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition" onclick="toggleHelpModal()">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl font-bold">
                        💡
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Bantuan Penggunaan</p>
                        <p class="text-sm font-semibold text-amber-300 mt-0.5">Klik untuk petunjuk mudah</p>
                    </div>
                </div>
                <span class="text-slate-400 text-xl">➔</span>
            </div>
        </div>

        <!-- SEARCH & DAFTAR DATA -->
        <div class="glass-card rounded-2xl p-6 shadow-xl space-y-5">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">
                    <span>📑</span> Daftar Topik & Data Statistik
                </h2>
                <div class="relative w-full sm:w-80">
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="🔍 Cari topik (misal: Kemiskinan)..." 
                        oninput="debouncedFilter()"
                        class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                </div>
            </div>

            <!-- TABLE -->
            <div class="overflow-x-auto rounded-xl border border-slate-700/60">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
                            <th class="p-4 w-16 text-center">No</th>
                            <th class="p-4 w-1/4">Nama Topik / Menu</th>
                            <th class="p-4">Isi Jawaban & Data Statistik</th>
                            <th class="p-4 w-32 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="faqTableBody" class="divide-y divide-slate-800 text-sm">
                        <tr>
                            <td colspan="4" class="p-8 text-center text-slate-400">
                                <p>Memuat data statistik...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- FOOTER -->
        <footer class="text-center text-xs text-slate-500 py-4">
            SAPA BPS Kab. Bangka © 2026 • Sistem Layanan Data Statistik Cerdas
        </footer>
    </div>

    <!-- MODAL FORM EDIT / TAMBAH DATA (BOOMER FRIENDLY) -->
    <div id="modalBackdrop" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div class="glass-card bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            <!-- Modal Header -->
            <div class="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/80">
                <div class="flex items-center gap-3">
                    <span id="modalIcon" class="text-2xl">✏️</span>
                    <h3 id="modalTitle" class="text-xl font-extrabold text-white">Edit Data Statistik</h3>
                </div>
                <button onclick="closeModal()" class="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition flex items-center justify-center text-xl font-bold">
                    ✕
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-5 sm:p-7 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <!-- KOLOM KIRI: FORMULIR INPUT -->
                <div class="lg:col-span-7 space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-slate-200 mb-1.5">
                            📌 Nama Topik / Judul Informasi:
                        </label>
                        <input 
                            type="text" 
                            id="inputPertanyaan" 
                            placeholder="Contoh: Jumlah Penduduk, Data Kemiskinan" 
                            oninput="updateLivePreviewDirect()"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-semibold"
                        >
                        <input type="hidden" id="inputOldPertanyaan">
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <label class="block text-sm font-bold text-slate-200">
                                📝 Isi Informasi / Angka Data:
                            </label>
                            <span class="text-xs text-slate-400">Ketik biasa seperti pesan WA</span>
                        </div>

                        <!-- TOMBOL BANTUAN FORMAT CEPAT -->
                        <div class="flex flex-wrap gap-1.5 mb-2 bg-slate-800 p-2 rounded-xl border border-slate-700/60">
                            <button type="button" onclick="insertFormat('bold')" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 rounded-lg font-bold transition flex items-center gap-1">
                                <span>🅱️</span> Tebalkan
                            </button>
                            <button type="button" onclick="insertFormat('point')" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 rounded-lg transition flex items-center gap-1">
                                <span>•</span> Tambah Poin
                            </button>
                            <button type="button" onclick="insertFormat('star')" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 rounded-lg transition flex items-center gap-1">
                                <span>⭐</span> Bintang
                            </button>
                            <button type="button" onclick="insertFormat('chart')" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 rounded-lg transition flex items-center gap-1">
                                <span>📊</span> Grafik
                            </button>
                            <button type="button" onclick="insertFormat('money')" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 rounded-lg transition flex items-center gap-1">
                                <span>💰</span> Rupiah
                            </button>
                        </div>

                        <textarea 
                            id="inputJawaban" 
                            rows="9" 
                            placeholder="Tuliskan isi data atau informasi di sini... Tekan Enter untuk ganti baris baru." 
                            oninput="updateLivePreviewDirect()"
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                        ></textarea>
                    </div>

                    <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2.5">
                        <span class="text-base">💡</span>
                        <span><strong>Pratinjau Otomatis:</strong> Simbol tanda bintang (<strong>*teks*</strong>) otomatis diubah menjadi <strong>tebal</strong> di layar pratinjau WhatsApp sebelah kanan.</span>
                    </div>
                </div>

                <!-- KOLOM KANAN: SIMULASI LIVE LAYAR HP WHATSAPP -->
                <div class="lg:col-span-5 flex flex-col">
                    <label class="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <span>📱</span> Pratinjau Tampilan di HP Penerima:
                    </label>
                    <div class="wa-bg flex-1 rounded-2xl p-4 border border-slate-700 shadow-inner flex flex-col justify-start min-h-[300px] overflow-y-auto">
                        
                        <!-- Balon Chat WhatsApp -->
                        <div class="wa-bubble p-4 shadow text-xs leading-relaxed max-w-[95%] space-y-2 self-start font-sans">
                            <div class="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1 text-sm tracking-tight" id="previewTitle">
                                📌 Judul Topik
                            </div>
                            <div class="text-slate-800 font-sans text-xs leading-relaxed space-y-1" id="previewBody">
                                Isi data yang Anda ketik akan langsung terlihat di sini persis seperti tampilan di WhatsApp tanpa kode atau simbol...
                            </div>
                            <div class="text-[10px] text-slate-400 text-right pt-1 flex items-center justify-end gap-1 font-sans">
                                <span>12:00</span>
                                <span class="text-blue-500 font-bold">✓✓</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <!-- Modal Footer -->
            <div class="p-4 sm:p-5 border-t border-slate-800 bg-slate-800/80 flex justify-end items-center gap-3">
                <button onclick="closeModal()" class="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 font-semibold transition">
                    Batal
                </button>
                <button id="btnSave" onclick="saveData()" class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-7 py-2.5 rounded-xl font-bold text-base shadow-lg shadow-emerald-600/20 transition flex items-center gap-2">
                    <span>💾</span> Simpan Perubahan
                </button>
            </div>

        </div>
    </div>

    <!-- MODAL PANDUAN PENGGUNAAN -->
    <div id="helpModal" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4">
        <div class="glass-card bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    <span>📖</span> Panduan Mudah Mengubah Data
                </h3>
                <button onclick="toggleHelpModal()" class="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div class="space-y-4 text-sm text-slate-300 leading-relaxed">
                <div class="flex gap-3">
                    <span class="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">1</span>
                    <p><strong>Mengubah Data:</strong> Cari topik data pada tabel, lalu klik tombol biru bertuliskan <strong>"✏️ Edit"</strong>.</p>
                </div>
                <div class="flex gap-3">
                    <span class="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">2</span>
                    <p><strong>Mengetik Isi Data:</strong> Ketik teks secara biasa seperti mengetik di HP. Untuk ganti baris, tekan <strong>Enter</strong>.</p>
                </div>
                <div class="flex gap-3">
                    <span class="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">3</span>
                    <p><strong>Melihat Hasil:</strong> Perhatikan simulasi WhatsApp di sebelah kanan untuk melihat tampilan aslinya tanpa simbol bintang.</p>
                </div>
                <div class="flex gap-3">
                    <span class="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">4</span>
                    <p><strong>Simpan Data:</strong> Klik tombol hijau <strong>"💾 Simpan Perubahan"</strong>.</p>
                </div>
            </div>
            <div class="pt-2 text-right">
                <button onclick="toggleHelpModal()" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition">
                    Saya Mengerti 👍
                </button>
            </div>
        </div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <div id="toast" class="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-transform duration-200 glass-card px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center gap-3">
        <span id="toastIcon" class="text-2xl">✅</span>
        <span id="toastMsg" class="text-sm font-bold text-white">Data berhasil disimpan!</span>
    </div>

    <script>
        var allFaqs = [];
        var filterTimer = null;

        function cleanHtmlForDisplay(text) {
            if (!text) return '';
            return text.replace(/<br\\s*\\/?>/gi, '\\n');
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        // WhatsApp Markdown Parser: Bersih tanpa class text-slate-950
        function parseWhatsAppFormatting(raw) {
            if (!raw) return '';
            var safe = escapeHtml(raw);

            // Bold: *teks* -> <strong>teks</strong> (styling warna diatur otomatis oleh CSS)
            var boldParts = safe.split('*');
            if (boldParts.length > 2) {
                var boldRes = '';
                for (var b = 0; b < boldParts.length; b++) {
                    if (b % 2 === 1 && boldParts[b].trim().length > 0) {
                        boldRes += '<strong>' + boldParts[b] + '</strong>';
                    } else {
                        boldRes += boldParts[b];
                    }
                }
                safe = boldRes;
            }

            // Italic: _teks_ -> <em>teks</em>
            var italicParts = safe.split('_');
            if (italicParts.length > 2) {
                var italicRes = '';
                for (var it = 0; it < italicParts.length; it++) {
                    if (it % 2 === 1 && italicParts[it].trim().length > 0) {
                        italicRes += '<em>' + italicParts[it] + '</em>';
                    } else {
                        italicRes += italicParts[it];
                    }
                }
                safe = italicRes;
            }

            // Line breaks
            safe = safe.split('\\n').join('<br>');
            return safe;
        }

        async function fetchFaqs() {
            try {
                var res = await fetch('/api/faqs');
                allFaqs = await res.json();
                renderTable(allFaqs);
                document.getElementById('totalCount').innerText = allFaqs.length;
            } catch (err) {
                console.error('Error fetching FAQs:', err);
                document.getElementById('faqTableBody').innerHTML = '<tr><td colspan="4" class="p-6 text-center text-red-400 font-semibold">Gagal memuat data dari server. Pastikan server aktif.</td></tr>';
            }
        }

        function renderTable(data) {
            var tbody = document.getElementById('faqTableBody');
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-400">Tidak ada data statistik ditemukan.</td></tr>';
                return;
            }

            var rows = '';
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                var cleanAnswer = cleanHtmlForDisplay(item.jawaban);
                var isShort = cleanAnswer.length < 180;
                var previewText = isShort ? cleanAnswer : cleanAnswer.substring(0, 180) + '...';
                var formattedPreview = parseWhatsAppFormatting(previewText);
                
                var isMissing = cleanAnswer.indexOf('tidak tersedia') !== -1 || cleanAnswer.indexOf('tidak tercantum') !== -1 || cleanAnswer.indexOf('belum tersedia') !== -1;
                var badge = isMissing 
                    ? '<span class="inline-block mt-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold rounded-md">⚠️ Perlu Dilengkapi</span>'
                    : '<span class="inline-block mt-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-md">✅ Data Tersedia</span>';

                rows += '<tr class="hover:bg-slate-800/40 transition-colors">';
                rows += '<td class="p-4 text-center font-bold text-slate-400 text-base">' + (i + 1) + '</td>';
                rows += '<td class="p-4 align-top"><div class="font-bold text-white text-base">' + escapeHtml(item.pertanyaan) + '</div>' + badge + '</td>';
                rows += '<td class="p-4 align-top text-slate-200 font-sans leading-relaxed text-xs sm:text-sm">' + formattedPreview + '</td>';
                rows += '<td class="p-4 align-middle text-center"><div class="flex items-center justify-center gap-2">';
                rows += '<button onclick="editFaq(' + i + ')" class="bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"><span>✏️</span> Edit</button>';
                rows += '<button onclick="deleteFaqByIndex(' + i + ')" class="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 px-2.5 py-2 rounded-xl text-xs font-bold transition">🗑️</button>';
                rows += '</div></td>';
                rows += '</tr>';
            }
            tbody.innerHTML = rows;
        }

        function debouncedFilter() {
            if (filterTimer) clearTimeout(filterTimer);
            filterTimer = setTimeout(filterTable, 120);
        }

        function filterTable() {
            var query = document.getElementById('searchInput').value.toLowerCase().trim();
            if (!query) {
                renderTable(allFaqs);
                return;
            }
            var filtered = allFaqs.filter(function(f) {
                return f.pertanyaan.toLowerCase().indexOf(query) !== -1 || 
                       f.jawaban.toLowerCase().indexOf(query) !== -1;
            });
            renderTable(filtered);
        }

        function openModal(isEdit) {
            var modal = document.getElementById('modalBackdrop');
            modal.classList.remove('hidden');
            if (!isEdit) {
                document.getElementById('modalTitle').innerText = 'Tambah Data Baru';
                document.getElementById('modalIcon').innerText = '➕';
                document.getElementById('inputPertanyaan').value = '';
                document.getElementById('inputOldPertanyaan').value = '';
                document.getElementById('inputJawaban').value = '';
                updateLivePreviewDirect();
            }
        }

        function closeModal() {
            document.getElementById('modalBackdrop').classList.add('hidden');
        }

        function editFaq(idx) {
            var item = allFaqs[idx];
            if (!item) return;
            document.getElementById('modalTitle').innerText = 'Edit Data: ' + item.pertanyaan;
            document.getElementById('modalIcon').innerText = '✏️';
            document.getElementById('inputPertanyaan').value = item.pertanyaan;
            document.getElementById('inputOldPertanyaan').value = item.pertanyaan;
            document.getElementById('inputJawaban').value = cleanHtmlForDisplay(item.jawaban);
            updateLivePreviewDirect();
            openModal(true);
        }

        function updateLivePreviewDirect() {
            var title = document.getElementById('inputPertanyaan').value.trim() || 'Judul Topik';
            var body = document.getElementById('inputJawaban').value.trim() || 'Isi data yang Anda ketik akan langsung terlihat di sini persis seperti tampilan di WhatsApp...';
            
            document.getElementById('previewTitle').innerHTML = '📌 ' + escapeHtml(title);
            document.getElementById('previewBody').innerHTML = parseWhatsAppFormatting(body);
        }

        function insertFormat(type) {
            var textarea = document.getElementById('inputJawaban');
            var start = textarea.selectionStart;
            var end = textarea.selectionEnd;
            var text = textarea.value;
            var sel = text.substring(start, end);

            var insert = '';
            if (type === 'bold') {
                insert = sel ? '*' + sel + '*' : '*Teks Tebal*';
            } else if (type === 'point') {
                insert = '\\n• ';
            } else if (type === 'star') {
                insert = '⭐ ';
            } else if (type === 'chart') {
                insert = '📊 ';
            } else if (type === 'money') {
                insert = 'Rp ';
            }

            textarea.value = text.substring(0, start) + insert + text.substring(end);
            textarea.focus();
            updateLivePreviewDirect();
        }

        async function saveData() {
            var pertanyaan = document.getElementById('inputPertanyaan').value.trim();
            var jawaban = document.getElementById('inputJawaban').value.trim();
            var old_pertanyaan = document.getElementById('inputOldPertanyaan').value.trim();

            if (!pertanyaan || !jawaban) {
                showToast('Mohon isi Judul Topik dan Isi Datanya', false);
                return;
            }

            jawaban = jawaban.replace(/\\r?\\n/g, '<br>');

            var btn = document.getElementById('btnSave');
            btn.disabled = true;
            btn.innerText = 'Menyimpan...';

            try {
                var res = await fetch('/api/faqs/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pertanyaan: pertanyaan, jawaban: jawaban, old_pertanyaan: old_pertanyaan })
                });
                var result = await res.json();
                if (result.status === 'success') {
                    showToast('✅ Perubahan Berhasil Disimpan!');
                    closeModal();
                    await fetchFaqs();
                } else {
                    showToast(result.message || 'Gagal menyimpan', false);
                }
            } catch (err) {
                console.error(err);
                showToast('Terjadi kesalahan koneksi', false);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span>💾</span> Simpan Perubahan';
            }
        }

        async function deleteFaqByIndex(idx) {
            var item = allFaqs[idx];
            if (!item) return;
            var pertanyaan = item.pertanyaan;

            if (!confirm('Apakah Anda yakin ingin menghapus data "' + pertanyaan + '"?')) return;

            try {
                var res = await fetch('/api/faqs/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pertanyaan: pertanyaan })
                });
                var result = await res.json();
                if (result.status === 'success') {
                    showToast('🗑️ Data berhasil dihapus!');
                    await fetchFaqs();
                } else {
                    showToast(result.message || 'Gagal menghapus', false);
                }
            } catch (err) {
                console.error(err);
                showToast('Terjadi kesalahan', false);
            }
        }

        function showToast(msg, isSuccess) {
            if (isSuccess === undefined) isSuccess = true;
            var toast = document.getElementById('toast');
            document.getElementById('toastMsg').innerText = msg;
            document.getElementById('toastIcon').innerText = isSuccess ? '✅' : '❌';
            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(function() {
                toast.classList.add('translate-y-20', 'opacity-0');
            }, 3000);
        }

        function toggleHelpModal() {
            var modal = document.getElementById('helpModal');
            modal.classList.toggle('hidden');
        }

        window.addEventListener('DOMContentLoaded', fetchFaqs);
        fetchFaqs();
    </script>
</body>
</html>`;
}
