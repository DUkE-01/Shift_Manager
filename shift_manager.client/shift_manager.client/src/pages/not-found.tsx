import { useLocation } from "wouter";

export default function NotFound() {
    const [, navigate] = useLocation();

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0a0f1e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Courier New', monospace",
            overflow: "hidden",
            position: "relative",
        }}>
            {/* Scanlines overlay */}
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10,
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
            }} />

            {/* Noise grain */}
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9, opacity: 0.04,
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http:
            }} />

            {/* Radar circle BG */}
            <div style={{
                position: "absolute", width: 700, height: 700,
                borderRadius: "50%",
                border: "1px solid rgba(0,255,128,0.06)",
                boxShadow: "0 0 0 60px rgba(0,255,128,0.02), 0 0 0 120px rgba(0,255,128,0.015), 0 0 0 200px rgba(0,255,128,0.01)",
                animation: "pulse 4s ease-in-out infinite",
            }} />

            <style>{`
        @import url('https:

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes glitch {
          0%   { clip-path: inset(0 0 95% 0); transform: translate(-4px, 0); }
          10%  { clip-path: inset(30% 0 50% 0); transform: translate(4px, 0); }
          20%  { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 0); }
          30%  { clip-path: inset(80% 0 5%  0); transform: translate(2px, 0); }
          40%  { clip-path: inset(10% 0 80% 0); transform: translate(0, 0); }
          50%  { clip-path: inset(50% 0 30% 0); transform: translate(-4px, 0); }
          60%  { clip-path: inset(20% 0 70% 0); transform: translate(4px, 0); }
          70%  { clip-path: inset(75% 0 10% 0); transform: translate(0, 0); }
          80%  { clip-path: inset(5%  0 90% 0); transform: translate(-2px, 0); }
          90%  { clip-path: inset(45% 0 45% 0); transform: translate(2px, 0); }
          100% { clip-path: inset(0 0 95% 0); transform: translate(0, 0); }
        }
        @keyframes scanline {
          0%   { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.4; }
        }
        .not-found-title {
          font-family: 'Orbitron', monospace;
          font-size: clamp(80px, 18vw, 160px);
          font-weight: 900;
          color: transparent;
          -webkit-text-stroke: 2px rgba(0,255,128,0.8);
          line-height: 1;
          position: relative;
          animation: flicker 6s infinite;
          letter-spacing: -2px;
          text-shadow: 0 0 40px rgba(0,255,128,0.3), 0 0 80px rgba(0,255,128,0.1);
        }
        .not-found-title::before,
        .not-found-title::after {
          content: "404";
          position: absolute; left: 0; top: 0;
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          width: 100%;
        }
        .not-found-title::before {
          color: rgba(255,0,80,0.7);
          animation: glitch 2.5s infinite linear;
          -webkit-text-stroke: 2px rgba(255,0,80,0.7);
        }
        .not-found-title::after {
          color: rgba(0,200,255,0.7);
          animation: glitch 2.5s 0.05s infinite linear reverse;
          -webkit-text-stroke: 2px rgba(0,200,255,0.7);
        }
        .mono-text {
          font-family: 'Share Tech Mono', monospace;
        }
        .btn-return {
          font-family: 'Share Tech Mono', monospace;
          background: transparent;
          border: 1px solid rgba(0,255,128,0.6);
          color: rgba(0,255,128,0.9);
          padding: 14px 36px;
          font-size: 13px;
          letter-spacing: 3px;
          cursor: pointer;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .btn-return::before {
          content: '';
          position: absolute; inset: 0;
          background: rgba(0,255,128,0.08);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .btn-return:hover::before { transform: translateX(0); }
        .btn-return:hover {
          border-color: rgba(0,255,128,1);
          color: #fff;
          box-shadow: 0 0 20px rgba(0,255,128,0.3), inset 0 0 20px rgba(0,255,128,0.05);
        }
        .terminal-line {
          animation: fadeIn 0.5s ease forwards;
          opacity: 0;
        }
        .terminal-line:nth-child(1) { animation-delay: 0.2s; }
        .terminal-line:nth-child(2) { animation-delay: 0.5s; }
        .terminal-line:nth-child(3) { animation-delay: 0.8s; }
        .terminal-line:nth-child(4) { animation-delay: 1.1s; }
        .terminal-line:nth-child(5) { animation-delay: 1.4s; }
        .cursor {
          display: inline-block;
          width: 8px; height: 14px;
          background: rgba(0,255,128,0.8);
          animation: blink 1s step-end infinite;
          vertical-align: text-bottom;
          margin-left: 2px;
        }
        .moving-scanline {
          position: absolute; left: 0; right: 0; height: 3px;
          background: linear-gradient(transparent, rgba(0,255,128,0.15), transparent);
          animation: scanline 3s linear infinite;
          pointer-events: none;
        }
      `}</style>

            <div style={{ position: "relative", zIndex: 20, textAlign: "center", padding: "0 24px", maxWidth: 680 }}>

                {/* 404 glitch title */}
                <div style={{ marginBottom: 8 }}>
                    <h1 className="not-found-title">404</h1>
                </div>

                {/* Status line */}
                <div className="mono-text" style={{
                    color: "rgba(0,255,128,0.6)", fontSize: 11, letterSpacing: 4,
                    textTransform: "uppercase", marginBottom: 40,
                    animation: "fadeIn 0.5s 0.1s ease forwards", opacity: 0,
                }}>
                    — SECTOR NO ENCONTRADO —
                </div>

                {/* Terminal block */}
                <div style={{
                    background: "rgba(0,255,128,0.03)",
                    border: "1px solid rgba(0,255,128,0.15)",
                    borderRadius: 2, padding: "24px 28px", marginBottom: 40,
                    textAlign: "left", position: "relative", overflow: "hidden",
                }}>
                    <div className="moving-scanline" />
                    <div className="terminal-line mono-text" style={{ color: "rgba(0,255,128,0.4)", fontSize: 11, marginBottom: 12 }}>
                        SISTEMA_TURNOS_PNM ~ $
                    </div>
                    <div className="terminal-line mono-text" style={{ color: "rgba(255,80,80,0.8)", fontSize: 13, marginBottom: 6 }}>
                        ERROR 404 — Página no encontrada en este sector
                    </div>
                    <div className="terminal-line mono-text" style={{ color: "rgba(0,255,128,0.5)", fontSize: 12, marginBottom: 6 }}>
                        &gt; Verificando coordenadas de navegación...
                    </div>
                    <div className="terminal-line mono-text" style={{ color: "rgba(0,200,255,0.6)", fontSize: 12, marginBottom: 6 }}>
                        &gt; La ruta solicitada no existe en la base de datos
                    </div>
                    <div className="terminal-line mono-text" style={{ color: "rgba(0,255,128,0.7)", fontSize: 12 }}>
                        &gt; Retornando al Panel de Control...<span className="cursor" />
                    </div>
                </div>

                {/* Botón */}
                <div style={{ animation: "fadeIn 0.5s 1.8s ease forwards", opacity: 0 }}>
                    <button className="btn-return" onClick={() => navigate("/")}>
                        ← VOLVER AL PANEL
                    </button>
                </div>

                {/* Footer coords */}
                <div className="mono-text" style={{
                    color: "rgba(0,255,128,0.2)", fontSize: 10, letterSpacing: 2,
                    marginTop: 48, animation: "fadeIn 0.5s 2s ease forwards", opacity: 0,
                }}>
                    POLICÍA MUNICIPAL STO. DGO. ESTE &nbsp;·&nbsp; LAT 18.4800° N &nbsp;·&nbsp; LON 69.8700° W
                </div>
            </div>
        </div>
    );
}