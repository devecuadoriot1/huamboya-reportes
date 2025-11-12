import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import "./index.css";
import "./App.css";
// Imagen de fondo ubicada en /public/fondo.png
const BG_URL = "/fondo.png";

// Manifest (seguro) de documentos disponibles (YYYY-MM -> URL)
const AVAILABLE_DOCS: Record<string, string> = {
  "2025-11": "/Reporte_complementario_vehiculos_sin_movimiento_2025-11.pdf",
  "2025-10": "/Reporte_complementario_vehiculos_sin_movimiento_2025-10.pdf",
};

export default function App() {
  const [docType, setDocType] = useState("pdf");
  const [monthKey, setMonthKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success" | ""; text: string }>({ type: "", text: "" });

  // Utilidades para mostrar fechas como: YYYY-MM-DD HH:mm
  function fmt2(n: number) { return String(n).padStart(2, "0"); }
  function formatDate(d: Date) {
    const y = d.getFullYear();
    const m = fmt2(d.getMonth() + 1);
    const day = fmt2(d.getDate());
    const hh = fmt2(d.getHours());
    const mm = fmt2(d.getMinutes());
    return `${y}-${m}-${day} ${hh}:${mm}`;
  }

  type Option = { value: string; label: string };

  function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Selecciona…",
  }: {
    options: Option[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState<number>(-1);
    const selected = options.find((o) => o.value === value);

    function toggle() { setOpen((o) => !o); }
    function choose(idx: number) {
      const opt = options[idx];
      if (!opt) return;
      onChange(opt.value);
      setOpen(false);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
        e.preventDefault(); setOpen(true); setActive(0); return;
      }
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); choose(active >= 0 ? active : 0); }
      else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    }

    return (
      <div className="relative">
        {/* MISMO estilo que tu select nativo */}
        <button
          type="button"
          onClick={toggle}
          onKeyDown={onKeyDown}
          className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pr-10 text-left text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#f2928f]"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
          <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Menú */}
        <div className={`${open ? "" : "hidden"} absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-2xl bg-white shadow-xl`} role="listbox">
          <ul className="p-1">
            {options.map((opt, idx) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => { e.preventDefault(); choose(idx); }}
                // SOLO HOVER: fondo blanco + borde fino #f2928f
                className="select-none rounded-xl px-3 py-2 text-sm cursor-pointer border border-transparent hover:bg-white hover:border-[#f2928f] whitespace-nowrap"
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Meses desde el actual hacia atrás (24) 
  const months = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const y = start.getFullYear();
      const m = String(start.getMonth() + 1).padStart(2, "0");
      const key = `${y}-${m}`;
      const end = new Date(y, start.getMonth() + 1, 1, 0, 0, 0, 0);
      const label = `${formatDate(start)}  ${formatDate(end)}`;
      out.push({ key, label });
    }
    return out;
  }, []);

  const canDownload = docType === "pdf" && monthKey !== "" && !busy;

  // Rango calculado por mes
  const monthRange = useMemo(() => {
    if (!monthKey) return null;
    const [y, m] = monthKey.split("-").map(Number);
    const start = new Date(y, (m ?? 1) - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, (m ?? 1), 1, 0, 0, 0, 0);
    return { start, end };
  }, [monthKey]);

  async function handleDownload() {
    setMsg({ type: "", text: "" });
    if (!canDownload) return;
    setBusy(true);
    try {
      const url = AVAILABLE_DOCS[monthKey];
      if (!url) {
        setMsg({ type: "error", text: `Aún no está listo el documento para ${monthKey}.` });
        return;
      }
      const a = document.createElement("a");
      a.href = url; a.download = "";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setMsg({ type: "success", text: "Descarga iniciada." });
    } catch (e) {
      setMsg({ type: "error", text: "No se pudo iniciar la descarga. Intenta otra vez." });
    } finally {
      setBusy(false);
    }
  }

  return (
    // Fullscreen overlay
    <div className="fixed inset-0 z-[9999] isolate">
      {/* Fondo */}
      <div className="absolute inset-0 -z-10">
        <img src={BG_URL} alt="Fondo" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Contenido centrado */}
      <div className="flex h-full items-center justify-center p-4 sm:p-6 lg:p-10">
        <section
          className="w-full max-w-4xl rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl ring-1 ring-black/10 p-6 sm:p-8"
          aria-labelledby="title"
          role="region"
        >
          <div className="flex items-center justify-left space-x-4">
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl">
              <Layers className="text-[#f2928f] h-[1em] w-[1em]" aria-hidden="true" />
            </div>

            <h1 id="title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-800 text-center">
              Reporte complementario de vehículos sin movimiento
            </h1>
          </div>
          <p className="mt-3 px-10 text-sm text-gray-600 text-left">
            Selecciona el tipo de documento y el mes. El botón se habilita cuando todo está listo.
          </p>

          {/* Mensajes accesibles */}
          <div aria-live="polite" className="sr-only">{msg.text}</div>

          {/* ====== LAYOUT: 2 columnas (md+), 1 columna (sm) ====== */}
          <div className="mt-6 grid grid-cols-1 gap-y-4 sm:grid-cols-2 period-grid sm:gap-x-8 sm:items-start">

            {/* Izquierda: Tipo + Formato (más angosto) */}
            <div className="space-y-4">
              <div className="w-full sm:max-w-[240px] sm:justify-self-start">
                <label className="block text-sm font-medium text-gray-800 text-left px-2">Tipo</label>
                <CustomSelect
                  options={[{ value: "pdf", label: "Reporte Mensual" }]}
                  value={docType}
                  onChange={(v) => setDocType(v)}
                />
              </div>

              <div className="w-full sm:max-w-[240px] sm:justify-self-start">
                <label className="block text-sm font-medium text-gray-800 text-left px-2">Formato</label>
                <CustomSelect
                  options={[{ value: "pdf", label: "PDF" }]}
                  value={docType}
                  onChange={(v) => setDocType(v)}
                />
                <span id="doc-help" className="mt-1 block text-xs text-gray-500">
                  Actualmente solo se admite PDF.
                </span>
              </div>
            </div>
            <div className="space-y-4 sm:col-start-2 sm:col-span-1 sm:w-full">
              <div className="w-full sm:max-w-[360px] sm:min-w-[360px] sm:justify-self-stretch">
                <label className="block text-sm font-medium text-gray-800 text-left px-2">Periodo</label>
                <CustomSelect
                  options={months.map((m) => ({ value: m.key, label: m.label }))}
                  value={monthKey}
                  onChange={(v) => setMonthKey(v)}
                />
                <span id="month-help" className="mt-1 block text-xs text-gray-500">
                  Desde el mes actual hacia atrás (24 meses).
                </span>
              </div>
            </div>
          </div>

          {/* Estado */}
          {msg.type && (
            <div
              className={`mt-4 w-full rounded-xl px-3 py-2 text-sm ${msg.type === "success" ? "bg-[#ffffff] text-[#f2928f] border border-[#f2928f]" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
              role="status"
            >
              {msg.text}
            </div>
          )}

          {/* Botón — ancho reducido */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!canDownload}
              className={`w-auto inline-flex items-center justify-center rounded-2xl px-6 py-2 text-base font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2928f] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${canDownload ? "bg-[#F29B99] text-white hover:bg-[#f2928f]" : "bg-gray-300 text-gray-600"
                }`}
              aria-disabled={!canDownload}
            >
              {busy ? "Preparando…" : "Descargar PDF"}
            </button>
          </div>

          {/* Tips */}
          <ul className="mt-2 list-disc pl-5 text-xs text-gray-500">
            Si el mes no está disponible se mostrará un mensaje de que aún no está listo.
          </ul>
        </section>
      </div>
    </div>
  );
}
