import { useState } from "react";
import type { Diagram } from "../../types";
import {
  exportPoster,
  exportPdf,
  exportGif,
  diagramToJson,
  downloadDataUrl,
  diagramBounds,
} from "../../lib/exportDiagram";

export interface ExportModalProps {
  diagram: Diagram;
  isOpen: boolean;
  onClose: () => void;
  viewportElement: HTMLElement | null;
}

type ExportTab = "poster" | "pdf" | "gif" | "json";

export function ExportModal({ diagram, isOpen, onClose, viewportElement }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("poster");

  // Poster Tab State
  const [posterFormat, setPosterFormat] = useState<"png" | "svg">("png");
  const [posterScale, setPosterScale] = useState<number>(2);
  const [posterBg, setPosterBg] = useState<string>("#0a0e1a");
  const [includeHeader, setIncludeHeader] = useState<boolean>(true);
  const [isExportingPoster, setIsExportingPoster] = useState(false);

  // PDF Tab State
  const [isMultiPagePdf, setIsMultiPagePdf] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // GIF Tab State
  const [gifProgress, setGifProgress] = useState<number | null>(null);

  if (!isOpen) return null;

  const bounds = diagramBounds(diagram.nodes);

  const handleDownloadPoster = async () => {
    if (!viewportElement) return;
    setIsExportingPoster(true);
    try {
      const dataUrl = await exportPoster(viewportElement, bounds, diagram, {
        format: posterFormat,
        scale: posterScale,
        backgroundColor: posterBg,
        includeHeader,
      });
      downloadDataUrl(dataUrl, `${diagram.name || "diagram"}_poster_${posterScale}x.${posterFormat}`);
    } catch (err) {
      console.error("Poster export failed:", err);
    } finally {
      setIsExportingPoster(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!viewportElement) return;
    setIsExportingPdf(true);
    try {
      await exportPdf(viewportElement, bounds, diagram, {
        multiPage: isMultiPagePdf,
      });
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadGif = async () => {
    if (!viewportElement) return;
    setGifProgress(0);
    try {
      await exportGif(viewportElement, bounds, diagram, (p) => setGifProgress(p));
    } catch (err) {
      console.error("GIF export failed:", err);
    } finally {
      setGifProgress(null);
    }
  };

  const handleExportJson = () => {
    downloadDataUrl(
      "data:application/json," + encodeURIComponent(diagramToJson(diagram)),
      `${diagram.name || "diagram"}.json`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-xl rounded-2xl border border-gray-800 bg-[#0d121f] shadow-2xl text-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-gray-950/50">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-xl text-sky-400">
              📸
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-100">Export Studio</h2>
              <p className="text-xs text-gray-400">
                High-Resolution Posters, Multi-Page PDF Reports, and Animated Assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-950/30 px-6">
          <button
            onClick={() => setActiveTab("poster")}
            className={`flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition mr-5 ${
              activeTab === "poster"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>🖼️</span> High-Res Poster
          </button>
          <button
            onClick={() => setActiveTab("pdf")}
            className={`flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition mr-5 ${
              activeTab === "pdf"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>📄</span> PDF Document
          </button>
          <button
            onClick={() => setActiveTab("gif")}
            className={`flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition mr-5 ${
              activeTab === "gif"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>🎞️</span> Looping GIF
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "json"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>💾</span> JSON Model
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* TAB 1: High-Res Poster */}
          {activeTab === "poster" && (
            <div className="space-y-4">
              {/* Resolution Scale Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-2">
                  Resolution & Scale Factor
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { scale: 1, label: "1x Standard", desc: "72 DPI • Fast" },
                    { scale: 2, label: "2x Crisp", desc: "144 DPI • Retina" },
                    { scale: 3, label: "3x Ultra HD", desc: "216 DPI • Slides" },
                    { scale: 4, label: "4x 4K Print", desc: "300 DPI • Poster" },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      onClick={() => setPosterScale(s.scale)}
                      className={`flex flex-col p-2.5 rounded-xl border text-left transition ${
                        posterScale === s.scale
                          ? "bg-sky-950/80 border-sky-500/80 text-sky-200 ring-1 ring-sky-500/30"
                          : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700 hover:bg-gray-900"
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">{s.label}</span>
                      <span className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format & Background */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Format</label>
                  <div className="flex rounded-xl border border-gray-800 bg-gray-900/60 p-1">
                    <button
                      onClick={() => setPosterFormat("png")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                        posterFormat === "png"
                          ? "bg-sky-600 text-white"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      PNG (High-Res)
                    </button>
                    <button
                      onClick={() => setPosterFormat("svg")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                        posterFormat === "svg"
                          ? "bg-sky-600 text-white"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      SVG (Vector)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">Background</label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/60 p-1">
                    {[
                      { bg: "#0a0e1a", label: "Nebula" },
                      { bg: "#000000", label: "OLED" },
                      { bg: "#ffffff", label: "Light" },
                      { bg: "transparent", label: "Clear" },
                    ].map((item) => (
                      <button
                        key={item.bg}
                        onClick={() => setPosterBg(item.bg)}
                        className={`flex-1 rounded-lg py-1 text-[11px] font-semibold transition ${
                          posterBg === item.bg
                            ? "bg-gray-800 text-white border border-gray-600"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Header Card Switch */}
              <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <div>
                  <div className="text-xs font-semibold text-gray-200">
                    Include Title & Metadata Header Banner
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Composites diagram title, author, component stats, and timestamp
                  </div>
                </div>
                <button
                  onClick={() => setIncludeHeader(!includeHeader)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    includeHeader ? "bg-sky-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      includeHeader ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadPoster}
                disabled={isExportingPoster}
                className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isExportingPoster ? "⏳" : "📥"}</span>
                <span>
                  {isExportingPoster
                    ? `Rendering ${posterScale}x Poster...`
                    : `Download ${posterScale}x High-Res ${posterFormat.toUpperCase()} Poster`}
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: PDF Document */}
          {activeTab === "pdf" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsMultiPagePdf(false)}
                  className={`flex flex-col p-4 rounded-xl border text-left transition ${
                    !isMultiPagePdf
                      ? "bg-sky-950/80 border-sky-500/80 text-sky-200 ring-1 ring-sky-500/30"
                      : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🖨️</span>
                    <span className="text-xs font-bold">Single-Page Poster</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Landscape A4 poster featuring full scaled diagram with title and metadata.
                  </p>
                </button>

                <button
                  onClick={() => setIsMultiPagePdf(true)}
                  className={`flex flex-col p-4 rounded-xl border text-left transition ${
                    isMultiPagePdf
                      ? "bg-sky-950/80 border-sky-500/80 text-sky-200 ring-1 ring-sky-500/30"
                      : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📑</span>
                    <span className="text-xs font-bold">Multi-Page Architecture Report</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    3-Page Report: Poster + Service Catalog Inventory + Flow & Dependency Matrix.
                  </p>
                </button>
              </div>

              {/* Preview Feature List */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-2 text-xs">
                <div className="font-semibold text-gray-300">
                  {isMultiPagePdf ? "Report Contents (3 Pages):" : "Poster Contents (1 Page):"}
                </div>
                <ul className="space-y-1.5 text-gray-400 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>
                      <strong className="text-gray-200">Page 1:</strong> High-Resolution Architecture Poster with Executive Blueprint Banner
                    </span>
                  </li>
                  {isMultiPagePdf && (
                    <>
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>
                          <strong className="text-gray-200">Page 2:</strong> Component Inventory & Microservices Catalog with health status and latency metrics
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>
                          <strong className="text-gray-200">Page 3:</strong> Pipeline Flow & Dependency Matrix with animated protocols and routing channels
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isExportingPdf ? "⏳" : "📥"}</span>
                <span>
                  {isExportingPdf
                    ? "Compiling PDF Document..."
                    : isMultiPagePdf
                    ? "Download Multi-Page Architecture Report (PDF)"
                    : "Download Single-Page Poster (PDF)"}
                </span>
              </button>
            </div>
          )}

          {/* TAB 3: Animated GIF */}
          {activeTab === "gif" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-200">
                  Looping Motion GIF Recording
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Captures a seamless 16-frame looping animation of glowing neon pulses and particles flowing through all active pipeline connectors.
                </p>
              </div>

              {gifProgress !== null && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-sky-300 font-semibold">
                    <span>Rendering Animated Frames...</span>
                    <span>{gifProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${gifProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleDownloadGif}
                disabled={gifProgress !== null}
                className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{gifProgress !== null ? "⏳" : "🎞️"}</span>
                <span>
                  {gifProgress !== null ? `Generating GIF (${gifProgress}%)...` : "Generate & Download Looping GIF"}
                </span>
              </button>
            </div>
          )}

          {/* TAB 4: JSON Model */}
          {activeTab === "json" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-200">
                  Full Diagram State (JSON)
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Export complete node positions, health metrics, connector configurations, and visual themes to import anytime or version in Git.
                </p>
              </div>

              <button
                onClick={handleExportJson}
                className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>Download Diagram JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
