from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
from fuzzywuzzy import fuzz
from database import get_db, engine
from models import Base, FAQ
from sqlalchemy.orm import Session
import uvicorn
import re
import os

# Inisialisasi Database
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[WARN] Inisialisasi database lokal/cloud: {e}")

app = FastAPI(title="SAPA BPS Kab. Bangka NLP Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model DialoGPT
chatbot_pipeline = pipeline("text-generation", model="microsoft/DialoGPT-medium")

# Default Data Cadangan (Jika Database Offline)
DEFAULT_FAQ_DATA = {
    "Jumlah Penduduk": "Jumlah penduduk Kab.Bangka 2024 menurut proyeksi penduduk sebanyak *342.058 jiwa*, dengan rincian:\n👨 Laki-laki: *175.865 jiwa*\n👩 Perempuan: *166.193 jiwa*.",
    "Data Kemiskinan": "Jumlah penduduk miskin Kab.Bangka 2024 sebesar *14,76 ribu jiwa* (4,24% dari total penduduk).\n\n📊 *Indeks Kemiskinan:*\n• Indeks Kedalaman Kemiskinan (P1): *0,62*\n• Indeks Keparahan Kemiskinan (P2): *0,14*",
    "Pertumbuhan Ekonomi": "Pertumbuhan Ekonomi Kab.Bangka 2024 sebesar *-0,44 persen*.\n\n📉 Perekonomian mengalami kontraksi pada komoditas industri pengolahan pertambangan & penggalian serta lapangan usaha konstruksi. _(Angka sangat sementara)_.",
    "Indeks Pembangunan Manusia (IPM)": "Nilai Indeks Pembangunan Manusia (IPM) Kab.Bangka tahun 2024 sebesar *74,66* (Kategori Pembangunan Manusia Tinggi), peringkat ke-3 se-Babel.\n\n📊 *Dimensi IPM 2024:*\n• Umur Harapan Hidup: *73,24 tahun*\n• Harapan Lama Sekolah: *13,12 tahun*\n• Rata-rata Lama Sekolah: *8,45 tahun*\n• Pengeluaran per Kapita: *Rp 13.205.000,- / tahun*",
    "Tenaga Kerja": "📊 *Indikator Ketenagakerjaan Kab. Bangka 2024:*\n• Tingkat Partisipasi Angkatan Kerja (TPAK): *67,92 persen*\n• Tingkat Pengangguran Terbuka (TPT): *4,91 persen*",
    "Produk Domestik Regional Bruto (PDRB)": "📊 *PDRB Kab. Bangka 2024:*\n• Atas Dasar Harga Berlaku (ADHB): *Rp 20.003,49 miliar*\n• Atas Dasar Harga Konstan (ADHK): *Rp 11.702,39 miliar*\n_(Angka sangat sementara)_.",
    "Apa itu BPS?": "🏛️ *Badan Pusat Statistik (BPS)* adalah Lembaga Pemerintah Nonkementerian yang bertanggung jawab langsung kepada Presiden, bertugas menyediakan data statistik dasar yang akurat dan terpercaya untuk pembangunan nasional.",
    "Apa saja layanan BPS?": "🏢 *Layanan Publik BPS Kabupaten Bangka:*\n1. Publikasi Buku Statistik & Berita Resmi Statistik (BRS)\n2. Pelayanan Statistik Terpadu (PST) & Konsultasi Data\n3. Penjualan & Penyediaan Data Mikro untuk Penelitian\n4. Rekomendasi Kegiatan Statistik Sektoral (ROMANTIK)",
    "Bagaimana cara mengakses data BPS?": "🌐 Anda dapat mengakses seluruh publikasi dan data statistik BPS secara gratis melalui portal resmi:\n👉 *Website Resmi:* https://bangkatengahkab.bps.go.id atau https://babel.bps.go.id\n👉 *Pusat Data Nasional:* https://www.bps.go.id"
}

# Kamus Sinonim
KEYWORD_SYNONYMS = {
    "hello": ["hello", "helo", "heloo", "helloo", "hai", "halo", "hallo", "haloo", "hay", "p", "assalamualaikum", "selamat pagi", "selamat siang", "selamat sore", "selamat malam"],
    "cara": ["bagaimana", "gimana", "gmna", "cara", "cra", "carra", "craa"],
    "akses": ["mengakses", "akses", "aksesin", "aksess", "aksses", "aksek", "akss", "aksesnya", "website", "web", "link"],
    "data": ["informasi", "informasii", "infomasi", "infro", "statistik", "statistk", "statik", "layanan", "laynaan"],
    "jumlah": ["jumlah", "jml", "jmlh", "jumla", "penduduk", "warga", "masyarakat", "populasi"],
    "kemiskinan": ["kemiskinan", "miskin", "orang miskin", "tidak mampu", "kmiskin", "penduduk miskin"],
    "ekonomi": ["pertumbuhan", "ekonomi", "ekonmi", "perkembangan", "perkonomian"],
    "indeks": ["ipm", "indeks", "index", "pembangunan manusia", "harapan hidup", "sekolah", "perkapita"],
    "kerja": ["tenaga", "kerja", "pengangguran", "nganggur", "angkatan kerja", "tenaga kerja"],
    "pdrb": ["pdrb", "produk domestik", "produk domestik regional bruto", "pendapatan daerah", "adhb", "adhk"]
}

class UserInput(BaseModel):
    message: str

def preprocess_input(message: str) -> str:
    message = re.sub(r'\s+', ' ', message.strip().lower())
    for canonical, synonyms in KEYWORD_SYNONYMS.items():
        for synonym in synonyms:
            message = message.replace(synonym.lower(), canonical)
    return message

def get_dynamic_faq_data(db: Session = None) -> dict:
    """Mengambil data FAQ dari MySQL TiDB Cloud secara dinamis."""
    if db is None:
        return DEFAULT_FAQ_DATA
    try:
        faqs = db.query(FAQ).all()
        if not faqs:
            for q, a in DEFAULT_FAQ_DATA.items():
                new_faq = FAQ(pertanyaan=q, jawaban=a)
                db.add(new_faq)
            db.commit()
            faqs = db.query(FAQ).all()
        if faqs:
            return {faq.pertanyaan: faq.jawaban for faq in faqs}
    except Exception as e:
        print(f"[WARN] Database offline, fallback ke data bawaan: {e}")
        try:
            db.rollback()
        except Exception:
            pass
    return DEFAULT_FAQ_DATA

def generate_dynamic_menu(faq_data: dict) -> str:
    """Membuat Menu Box Estetik yang sinkron dengan database."""
    emoji_numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    
    faq_items = [q for q in faq_data.keys() if q.lower() not in ["hello!", "hello", "halo", "hai"]]
    menu_lines = []
    
    for idx, question in enumerate(faq_items):
        icon = emoji_numbers[idx] if idx < len(emoji_numbers) else f"🔹 *{idx+1}.*"
        menu_lines.append(f"│ {icon} *{question}*")

    menu_list_text = "\n".join(menu_lines)

    return (
        f"🏛️ *BADAN PUSAT STATISTIK KABUPATEN BANGKA*\n"
        f"📱 *SAPA BPS - Virtual Statistical Assistant*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"✨ *Halo, Sobat Data!*\n"
        f"Selamat datang di Layanan Informasi Statistik BPS Kab. Bangka.\n\n"
        f"Silakan pilih topik dengan mengetik *Nomor* atau *Nama Topik*:\n\n"
        f"┌── 📊 *DAFTAR INFORMASI & DATA TERSEDIA*\n"
        f"{menu_list_text}\n"
        f"└───\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"💡 *Petunjuk:*\n"
        f"👉 Cukup ketik angka (contoh: *1*) untuk memilih topik.\n"
        f"👉 Atau ketik pertanyaan langsung (contoh: _\"berapa angka kemiskinan?\"_).\n"
        f"👉 Ketik *menu* kapan saja untuk kembali ke daftar ini.\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

def format_pretty_response(topic: str, content: str) -> str:
    """Membungkus respons data dengan Card Styling yang cantik."""
    clean_content = content.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    return (
        f"📊 *LAYANAN INFORMASI BPS KAB. BANGKA*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📌 *Topik:* *{topic}*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"{clean_content}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"💡 _Ketik *menu* untuk melihat topik data lainnya._"
    )

def get_faq_by_index(index_num: int, faq_data: dict) -> tuple[str, str]:
    faq_items = [q for q in faq_data.keys() if q.lower() not in ["hello!", "hello", "halo", "hai"]]
    if 1 <= index_num <= len(faq_items):
        target_question = faq_items[index_num - 1]
        return target_question, faq_data[target_question]
    return None, None

def find_best_faq_match(user_message: str, faq_data: dict = None) -> tuple[str, int]:
    if faq_data is None:
        faq_data = DEFAULT_FAQ_DATA

    original_message_lower = user_message.lower()
    processed_message = preprocess_input(user_message)
    best_match = None
    highest_score = 0

    if "pdrb" in original_message_lower or "produk domestik" in original_message_lower:
        for q_key in faq_data:
            if "pdrb" in q_key.lower() or "produk domestik" in q_key.lower():
                return q_key, 100

    for question_key in faq_data:
        if user_message.strip().upper() == question_key.strip().upper():
            return question_key, 100
        if user_message.upper() in question_key.upper() and len(user_message) > 2:
            return question_key, 95

    for question_key in faq_data:
        processed_question_key = preprocess_input(question_key)
        partial_score = fuzz.partial_ratio(processed_message, processed_question_key)
        token_sort_score = fuzz.token_sort_ratio(processed_message, processed_question_key)
        ratio_score = fuzz.ratio(processed_message, processed_question_key)
        combined_score = (partial_score * 0.5 + token_sort_score * 0.3 + ratio_score * 0.2)

        if combined_score > 70 and combined_score > highest_score:
            best_match = question_key
            highest_score = combined_score

    if not best_match:
        for question_key in faq_data:
            question_words = set(preprocess_input(question_key).split())
            message_words = set(processed_message.split())
            common_words = question_words.intersection(message_words)
            if len(common_words) >= 1:
                return question_key, 75

    return best_match, highest_score

@app.post("/chat")
async def chat(user_input: UserInput, db: Session = Depends(get_db)):
    user_message = user_input.message.strip()
    faq_data = get_dynamic_faq_data(db)

    if len(user_message) <= 2:
        response_text = "Mohon masukkan pertanyaan yang lebih lengkap agar saya bisa membantu Anda."
    else:
        best_match, score = find_best_faq_match(user_message, faq_data)
        if best_match and score > 70:
            response_text = faq_data[best_match]
        else:
            response_text = "Maaf, informasi yang Anda cari belum tersedia di sistem kami. Silakan coba gunakan kata kunci lain."

    return {"response": response_text}

@app.get("/faq")
async def faq(db: Session = Depends(get_db)):
    return get_dynamic_faq_data(db)

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    data = {}
    
    if "application/json" in content_type:
        try:
            data = await request.json()
        except Exception:
            data = {}
    else:
        try:
            form_data = await request.form()
            data = dict(form_data)
        except Exception:
            try:
                body = await request.body()
                from urllib.parse import parse_qs
                parsed = parse_qs(body.decode('utf-8'))
                data = {k: v[0] for k, v in parsed.items()}
            except Exception:
                data = {}
        
    sender = data.get("sender")
    message = data.get("message", "").strip()
    
    if not sender or not message:
        return {"status": "ignored", "reason": "sender or message is empty"}
        
    faq_data = get_dynamic_faq_data(db)
    msg_clean = message.strip().lower()

    # 1. Menu Trigger (Salam / Perintah Menu)
    GREETING_TRIGGERS = ["menu", "bantuan", "help", "info", "halo", "hai", "hello", "helo", "hallo", "p", "start", "mulai", "pilihan", "list", "daftar"]
    if msg_clean in GREETING_TRIGGERS:
        response_text = generate_dynamic_menu(faq_data)

    # 2. Pilihan Nomor Menu Cepat (1, 2, 3...)
    elif msg_clean.isdigit():
        choice_num = int(msg_clean)
        q_title, q_ans = get_faq_by_index(choice_num, faq_data)
        if q_title and q_ans:
            response_text = format_pretty_response(q_title, q_ans)
        else:
            response_text = (
                f"⚠️ Nomor menu *{choice_num}* tidak tersedia.\n\n"
                f"{generate_dynamic_menu(faq_data)}"
            )

    # 3. Pencarian Kata Kunci / Pertanyaan Bebas
    else:
        best_match, score = find_best_faq_match(message, faq_data)
        if best_match and score > 70:
            response_text = format_pretty_response(best_match, faq_data[best_match])
        else:
            try:
                contextual_message = (
                    f"Apa itu {message}?" if len(message.split()) == 1 else message
                )
                nlp_response = chatbot_pipeline(
                    contextual_message,
                    max_length=150,
                    num_return_sequences=1,
                    do_sample=True,
                    top_p=0.9,
                    temperature=0.7,
                    pad_token_id=chatbot_pipeline.tokenizer.eos_token_id
                )[0]["generated_text"]

                if nlp_response.startswith(contextual_message):
                    nlp_response = nlp_response[len(contextual_message):].strip()

                if nlp_response and len(nlp_response) > 3:
                    response_text = (
                        f"🤖 *RESPON ASISTEN STATISTIK*\n"
                        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        f"{nlp_response}\n\n"
                        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        f"💡 _Ketik *menu* untuk melihat topik data resmi BPS Bangka._"
                    )
                else:
                    response_text = (
                        f"Maaf, informasi tentang *\"{message}\"* belum ada di database kami.\n\n"
                        f"{generate_dynamic_menu(faq_data)}"
                    )
            except Exception:
                response_text = (
                    f"Maaf, informasi tentang *\"{message}\"* belum tersedia.\n\n"
                    f"{generate_dynamic_menu(faq_data)}"
                )

    return {"status": "success", "response": response_text}

if __name__ == '__main__':
    uvicorn.run(app, port=8000, host='127.0.0.1')
