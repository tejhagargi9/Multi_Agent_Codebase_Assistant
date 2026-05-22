import { Routes, Route, Link } from "react-router-dom";
import Upload from "./pages/Upload";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <div className="min-h-screen bg-[#080c14]">
      {/* Optional global nav */}
      <nav className="border-b border-white/10 px-8 py-3 flex items-center justify-between text-sm" 
           style={{ background: "rgba(8,12,20,0.95)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-white hover:text-sky-400 transition-colors">
            Codebase Assistant
          </Link>
          <Link to="/" className="text-slate-400 hover:text-white">Upload</Link>
          <Link to="/chat" className="text-slate-400 hover:text-white">Agent Chat</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>
  );
}
