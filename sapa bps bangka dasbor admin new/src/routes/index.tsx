import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  LayoutGrid,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel Kelola Data Chatbot BPS Kab. Bangka" },
      {
        name: "description",
        content:
          "Panel admin pengelolaan data statistik untuk chatbot WhatsApp Badan Pusat Statistik Kabupaten Bangka.",
      },
      { property: "og:title", content: "Panel Kelola Data Chatbot BPS Kab. Bangka" },
      {
        property: "og:description",
        content:
          "Kelola topik dan jawaban statistik chatbot WhatsApp BPS Kabupaten Bangka dalam satu panel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPanel,
});

type Topik = {
  id: number;
  nama: string;
  kategori: string;
  isi: string;
  sumber: string;
  diperbarui: string;
};

const DATA: Topik[] = [
  {
    id: 1,
    nama: "Jumlah Penduduk",
    kategori: "Kependudukan",
    isi: "Jumlah Penduduk Kabupaten Bangka tahun 2025 tercatat sebanyak 346.069 jiwa.",
    sumber: "Proyeksi Penduduk 2020–2035 Hasil SP2020, BPS.",
    diperbarui: "12 Agu 2026",
  },
  {
    id: 2,
    nama: "Data Kemiskinan",
    kategori: "Sosial",
    isi: "Persentase penduduk miskin Kabupaten Bangka tahun 2025 sebesar 4,62 persen, turun 0,18 poin dibanding tahun sebelumnya.",
    sumber: "Survei Sosial Ekonomi Nasional (Susenas) Maret 2025.",
    diperbarui: "05 Agu 2026",
  },
  {
    id: 3,
    nama: "Inflasi Bulanan",
    kategori: "Harga",
    isi: "Inflasi month-to-month Kabupaten Bangka pada Juli 2026 tercatat 0,21 persen, dengan andil terbesar dari kelompok makanan dan minuman.",
    sumber: "Indeks Harga Konsumen (IHK) BPS.",
    diperbarui: "01 Agu 2026",
  },
  {
    id: 4,
    nama: "Ketenagakerjaan (TPT)",
    kategori: "Ketenagakerjaan",
    isi: "Tingkat Pengangguran Terbuka Kabupaten Bangka Agustus 2025 sebesar 3,74 persen dari total angkatan kerja.",
    sumber: "Survei Angkatan Kerja Nasional (Sakernas).",
    diperbarui: "28 Jul 2026",
  },
  {
    id: 5,
    nama: "PDRB & Pertumbuhan Ekonomi",
    kategori: "Ekonomi",
    isi: "Pertumbuhan ekonomi Kabupaten Bangka tahun 2025 mencapai 4,15 persen (y-on-y) dengan PDRB ADHB sebesar Rp 21,3 triliun.",
    sumber: "PDRB Kabupaten Bangka Menurut Lapangan Usaha.",
    diperbarui: "20 Jul 2026",
  },
  {
    id: 6,
    nama: "Indeks Pembangunan Manusia",
    kategori: "Sosial",
    isi: "IPM Kabupaten Bangka tahun 2025 sebesar 74,86 dan berada pada kategori tinggi.",
    sumber: "Publikasi IPM BPS Provinsi Kep. Bangka Belitung.",
    diperbarui: "15 Jul 2026",
  },
];

function AdminPanel() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DATA;
    return DATA.filter(
      (d) =>
        d.nama.toLowerCase().includes(s) ||
        d.kategori.toLowerCase().includes(s) ||
        d.isi.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bps-stripe h-1.5 w-full" />

      {/* Topbar resmi */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3.5">
          <div className="bps-gradient flex size-11 items-center justify-center rounded-md text-primary-foreground shadow-raised">
            <BarChart3 className="size-6" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">
              Badan Pusat Statistik
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Kabupaten Bangka · Provinsi Kepulauan Bangka Belitung
            </p>
          </div>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <LayoutGrid className="size-4" /> Dasbor
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Settings className="size-4" /> Pengaturan
            </Button>
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5">
            <span className="size-2 rounded-full bg-success" />
            <span className="text-xs font-medium text-foreground">Admin BPS</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        {/* Panel utama */}
        <section className="bps-gradient overflow-hidden rounded-xl px-7 py-8 shadow-raised">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                Layanan Statistik Digital
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-primary-foreground md:text-4xl">
                Panel Kelola Data Chatbot WhatsApp
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
                Perbarui topik dan jawaban statistik yang dilayani chatbot BPS Kabupaten Bangka.
                Semudah mengetik pesan, langsung tayang ke pengguna.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col md:items-stretch">
              <Button size="lg" variant="secondary" className="font-semibold">
                <Plus className="size-4" /> Tambah Data Baru
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/35 bg-transparent font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Download className="size-4" /> Unduh Cadangan CSV
              </Button>
            </div>
          </div>
        </section>

        {/* Ringkasan */}
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<FileSpreadsheet className="size-5" />}
            tone="primary"
            label="Total Topik Resmi"
            value="10"
            note="Terverifikasi tim statistik"
          />
          <StatCard
            icon={<MessageCircle className="size-5" />}
            tone="success"
            label="Status Chatbot"
            value="Aktif Melayani"
            note="Terhubung ke WhatsApp Business"
          />
          <StatCard
            icon={<HelpCircle className="size-5" />}
            tone="accent"
            label="Bantuan Penggunaan"
            value="Panduan Singkat"
            note="Klik untuk petunjuk mudah"
          />
        </section>

        {/* Tabel */}
        <section className="mt-5 rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-col gap-4 border-b border-border px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Daftar Topik &amp; Data Statistik
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {rows.length} topik ditampilkan dari {DATA.length} topik tersimpan.
              </p>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari topik (misal: Kemiskinan)…"
                className="pl-9"
                aria-label="Cari topik"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="w-14 px-6 py-3 font-semibold">No</th>
                  <th className="w-64 px-4 py-3 font-semibold">Nama Topik / Menu</th>
                  <th className="px-4 py-3 font-semibold">Isi Jawaban &amp; Data Statistik</th>
                  <th className="w-36 px-6 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => (
                  <tr
                    key={d.id}
                    className="border-t border-border align-top transition-colors hover:bg-muted/40"
                  >
                    <td className="px-6 py-5 font-semibold tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-5">
                      <p className="font-semibold text-foreground">{d.nama}</p>
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                        {d.kategori}
                      </span>
                      <span className="mt-2 ml-1.5 inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-medium text-success">
                        <CheckCircle2 className="size-3.5" /> Data tersedia
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <p className="max-w-2xl leading-relaxed text-foreground">{d.isi}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/70">Sumber:</span> {d.sumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Diperbarui {d.diperbarui}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="font-medium">
                          <Pencil className="size-3.5" /> Ubah
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Hapus ${d.nama}`}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center text-muted-foreground">
                      Topik tidak ditemukan. Coba kata kunci lain.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-8 border-t border-border pt-5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            Badan Pusat Statistik Kabupaten Bangka
          </p>
          <p className="mt-1">
            Jl. Ahmad Yani, Sungailiat · Layanan chatbot statistik terpadu ·{" "}
            <span className="text-primary">bangkakab.bps.go.id</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: "primary" | "success" | "accent";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    accent: "bg-accent/12 text-accent",
  } as const;

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className={`flex size-11 items-center justify-center rounded-lg ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}
