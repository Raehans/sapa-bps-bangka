from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
from fuzzywuzzy import fuzz
from database import get_db, engine
from models import Base, HistoryMaster, HistoryDetail, FAQ
from sqlalchemy.orm import Session
import uvicorn
from datetime import datetime
import re
import httpx
import os

# Buat tabel otomatis jika belum ada (Safe execution)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[WARN] Tidak dapat menghubungkan database pada saat startup: {e}")

# Token Fonnte (Dapatkan dari fonnte.com setelah menghubungkan nomor WA Anda)
FONNTE_TOKEN = os.getenv("FONNTE_TOKEN", "dHc8YyokJ2LLmF638XEK")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load DialoGPT pipeline
chatbot_pipeline = pipeline("text-generation", model="microsoft/DialoGPT-medium")

# Default / Fallback FAQ Data
DEFAULT_FAQ_DATA = {
    "Hello!": "Hello, Selamat Datang di ChatStat BPS Kabupaten Bangka.",
    "Apa itu BPS?": "Badan Pusat Statistik (BPS) adalah lembaga pemerintah yang bertugas menyediakan data statistik untuk Indonesia.",
    "Bagaimana cara mengakses data BPS?": "Anda dapat mengakses data BPS melalui website resmi https://www.bps.go.id.",
    "Apa saja layanan BPS?": "Layanan BPS meliputi publikasi data, konsultasi statistik, dan penyediaan data mikro untuk penelitian.",
    "Jumlah Penduduk": "Jumlah penduduk Kab.Bangka 2024 menurut proyeksi penduduk sebanyak 342.058 <br> jiwa dengan rincian penduduk laki-laki 175.865 jiwa dan perempuan 166.193 jiwa.",
    "Data Kemiskinan": "Jumlah penduduk miskin Kab.Bangka 2024 sebesar 14,76 ribu jiwa atau sebesar 4,24 persen penduduk miskin. <br> Untuk Indeks Kedalaman Kemiskinan (P1) sebesar 0,62 dan Indeks Keparahan Kemiskinan (P2) sebesar 0,14.",
    "Pertumbuhan Ekonomi": "Pertumbuhan Ekonomi Kab.Bangka 2024 sebesar -0,44 persen. <br> Selama tahun 2024, perkonomian Kab.Bangka mengalami kontraksi di beberapa komoditas yang memiliki peranan besar pada perkonomian daerah, yaitu <br> industri pengolahan pertambangan dan penggalian serta lapangan usaha konstruksi. <br> Angka tahun 2024 adalah angka sangat sementara",
    "Indeks Pembangunan Manusia (IPM)": "Nilai Indeks Pembangunan Manusia (IPM) Kab.Bangka tahun 2024 sebesar 74,66 dan masuk dalam kategori pembangunan manusia yang tinggi. Kab.Bangka menempati posisi ketiga kab/kota dengan nilai IPM tertinggi se-Prov.Kep.Bangka Belitung. <br> Dimensi IPM Kab.Bangka 2024: <br> Umur Harapan Hidup Saat Lahir: 73,24 tahun <br> Harapan Lama Sekolah: 13,12 tahun <br> Rata-rata Lama Sekolah: 8,45 tahun <br> Pengeluaran per Kapita Disesuaikan: 13.205 ribu rupiah per tahun",
    "Tenaga Kerja": "Tingkat Partisipasi Angkatan Kerja (TPAK) Kab.Bangka 2024 sebesar 67,92 persen dan <br> Tingkat Pengangguran Terbuka (TPT) sebesar 4,91 persen.",
    "Produk Domestik Regional Bruto (PDRB)": "Produk Domestik Regional Bruto (PDRB) Kab.Bangka 2024 menurut Harga Berlaku adalah <br> 20.003,49 miliar rupiah dan Harga Konstan 11.702,39 miliar rupiah. <br> Angka tahun 2024 adalah angka sangat sementara."
}

# Synonym mapping
KEYWORD_SYNONYMS = {
    "hello": [
        "hello", "helo", "heloo", "helloo", "hai", "halo", "hallo", "haloo", "hay", "hell"
    ],
    "cara": [
        "bagaimana", "gimana", "gmna", "cara", "cra", "carra", "craa"
    ],
    "akses": [
        "mengakses", "akses", "aksesin", "aksess", "aksses", "aksek", "akss", "aksesnya", "akese"
    ],
    "data": [
        "informasi", "informasii", "infomasi", "infro", "statistik", "statistk", "statik", "statikstik", "layanan", "laynaan", "layanann", "layaanan"
    ],
    "jumlah": [
        "jumlah", "jml", "jmlh", "jumla", "jumalah", "jmlah", "jumllah", "jumlahh", "jumalh", "jmhlah"
    ],
    "kemiskinan": [
        "kemiskinan", "kemisikan", "kemisikin", "kemisknn", "kmiskin", "kemsikinan", "kemiskinan", "kemiksinan", "kemiskina", "kmisikinan", "kmiskinan", "mampu"
    ],
    "ekonomi": [
        "prtmbhn", "pertumbuhan", "ekonomi", "ekonmi", "ekonimi", "ekonmy", "eknmi", "econmi", "perkonomian", "perkonomian", "pertumbuhn", "pertnuhan"
    ],
    "indeks": [
        "IPM", "ipm", "indeks", "index", "indek", "indekx", "indes", "pembangunan manusia", "harapan hidup", "harapan hidop", "lama sekolah", "perkapita", "per kapita", "prkapita", "pr capita", "perkapta"
    ],
    "kerja": [
        "tenaga", "krja", "kerja", "kerjaa", "pengangguran", "penganggura", "penganguran", "nganggur", "nganggurr", "penganguran", "tenagakerja", "tenaga kerja", "tenaker"
    ],
    "produk": [
        "produk", "PDRB", "pdrb", "prdk", "prodok", "prduk", "prdkk", "domestik", "domestk", "domsetik", "domistik", "regional", "regionl", "reginal", "regioal", "bruto", "brto", "brutoo", "brut", "berlaku", "berlku", "berlakuu", "berlakku", "konstan", "konstn", "konstann", "konstaan"
    ],
    "pdrb": [
        "PDRB", "pdrb", "produk domestik regional bruto", "produk domstik regional bruto", "produk dometik regional bruto", "produk domstik regioal bruto", "produk dometik regonal brto"
    ]
}


class UserInput(BaseModel):
    message: str

def preprocess_input(message: str) -> str:
    """Normalize and replace synonyms."""
    message = re.sub(r'\s+', ' ', message.strip().lower())
    for canonical, synonyms in KEYWORD_SYNONYMS.items():
        for synonym in synonyms:
            message = message.replace(synonym.lower(), canonical)
    return message

def get_dynamic_faq_data(db: Session = None) -> dict:
    """
    Mengambil data FAQ dari tabel MySQL 'faqs'.
    Otomatis melakukan seed jika tabel kosong, dan fallback aman ke DEFAULT_FAQ_DATA jika terjadi error.
    """
    if db is None:
        return DEFAULT_FAQ_DATA

    try:
        faqs = db.query(FAQ).all()
        # Jika tabel masih kosong, lakukan seeding otomatis dari DEFAULT_FAQ_DATA
        if not faqs:
            for q, a in DEFAULT_FAQ_DATA.items():
                new_faq = FAQ(pertanyaan=q, jawaban=a)
                db.add(new_faq)
            db.commit()
            faqs = db.query(FAQ).all()

        if faqs:
            return {faq.pertanyaan: faq.jawaban for faq in faqs}
    except Exception as e:
        print(f"[WARN] Gagal membaca FAQ dari database, fallback ke data bawaan: {e}")
        try:
            db.rollback()
        except Exception:
            pass

    return DEFAULT_FAQ_DATA

def find_best_faq_match(user_message: str, faq_data: dict = None) -> tuple[str, int]:
    """Mencari pertanyaan FAQ yang paling cocok dengan pesan pengguna."""
    if faq_data is None:
        faq_data = DEFAULT_FAQ_DATA

    original_message_lower = user_message.lower()
    processed_message = preprocess_input(user_message)

    best_match = None
    highest_score = 0

    # 1. Prioritaskan kecocokan frasa kunci spesifik
    if "pdrb" in original_message_lower or "produk domestik regional bruto" in original_message_lower:
        for q_key in faq_data:
            if "pdrb" in q_key.lower() or "produk domestik" in q_key.lower():
                return q_key, 100

    # 2. Coba kecocokan langsung atau sangat mirip dengan kunci FAQ
    for question_key in faq_data:
        if user_message.strip().upper() == question_key.strip().upper():
            return question_key, 100
        if user_message.upper() in question_key.upper() and len(user_message) > 2:
            return question_key, 95

    # 3. Fuzzy matching dengan pesan yang sudah diproses
    for question_key in faq_data:
        processed_question_key = preprocess_input(question_key)

        partial_score = fuzz.partial_ratio(processed_message, processed_question_key)
        token_sort_score = fuzz.token_sort_ratio(processed_message, processed_question_key)
        ratio_score = fuzz.ratio(processed_message, processed_question_key)

        combined_score = (partial_score * 0.5 + token_sort_score * 0.3 + ratio_score * 0.2)

        if combined_score > 70 and combined_score > highest_score:
            best_match = question_key
            highest_score = combined_score

    # 4. Keyword fallback
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

    # Ambil data FAQ dinamis dari Database MySQL
    faq_data = get_dynamic_faq_data(db)

    # Validasi input pendek
    if len(user_message) <= 2:
        response_text = "Mohon masukkan pertanyaan yang lebih lengkap agar saya bisa membantu Anda."
    else:
        # Cek pertanyaan mirip di FAQ dinamis
        best_match, score = find_best_faq_match(user_message, faq_data)
        if best_match and score > 70:
            response_text = faq_data[best_match]
        else:
            # Tidak menggunakan DialoGPT untuk web
            response_text = "Maaf, informasi yang Anda cari belum tersedia di sistem kami. Silakan coba gunakan kata kunci lain."

    return {"response": response_text}

@app.get("/faq")
async def faq(db: Session = Depends(get_db)):
    """Mengembalikan daftar FAQ yang aktif dari database."""
    return get_dynamic_faq_data(db)

async def send_whatsapp_message(target: str, message: str):
    """Mengirim pesan balasan ke WhatsApp menggunakan API Fonnte."""
    url = "https://api.fonnte.com/send"
    headers = {
        "Authorization": FONNTE_TOKEN
    }
    
    clean_message = re.sub(r'<br\s*/?>', '\n', message)
    clean_message = re.sub(r'<[^>]+>', '', clean_message)
    
    data = {
        "target": target,
        "message": clean_message
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, data=data)
            print(f"WhatsApp sent response: {response.json()}")
            return response.json()
        except Exception as e:
            print(f"Error sending WhatsApp message to {target}: {e}")
            return None

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """Endpoint Webhook untuk menerima pesan masuk dari WhatsApp."""
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
    else:
        form_data = await request.form()
        data = dict(form_data)
        
    sender = data.get("sender")
    message = data.get("message", "").strip()
    
    if not sender or not message:
        return {"status": "ignored", "reason": "sender or message is empty"}
        
    # Ambil data FAQ dinamis dari Database MySQL
    faq_data = get_dynamic_faq_data(db)

    # Proses pencarian jawaban menggunakan logika chatbot
    if len(message) <= 2:
        response_text = "Mohon masukkan pertanyaan yang lebih lengkap agar saya bisa membantu Anda."
    else:
        best_match, score = find_best_faq_match(message, faq_data)
        if best_match and score > 70:
            response_text = faq_data[best_match]
        else:
            # Fallback ke DialoGPT NLP
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

                response_text = nlp_response or "Maaf, saya tidak bisa menghasilkan respons yang sesuai."
            except Exception as e:
                response_text = "Maaf, saat ini saya mengalami kendala teknis dalam memproses pertanyaan Anda."

    # Kirim balasan
    if FONNTE_TOKEN != "YOUR_FONNTE_TOKEN_HERE" and FONNTE_TOKEN != "":
        await send_whatsapp_message(sender, response_text)
        return {"status": "success", "response": response_text}
    else:
        return {"status": "debug_success", "response": response_text, "note": "Local/Baileys response"}

if __name__ == '__main__':
    uvicorn.run(app, port=8000, host='127.0.0.1')