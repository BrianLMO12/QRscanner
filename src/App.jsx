import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "./firebase";
import {
  child,
  onChildAdded,
  onValue,
  push,
  ref,
  set,
  query,
  limitToLast,
} from "firebase/database";
import "./App.css";

const isScannerRoute = (path) => path.toLowerCase().startsWith("/scan/");
const getSessionIdFromPath = () => {
  const path = window.location.pathname.replace(/\/+/g, "/").replace(/\/$/, "");
  if (isScannerRoute(path)) {
    return path.replace("/scan/", "") || null;
  }
  return null;
};

const createSessionId = () => {
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
};

function Dashboard() {
  const [sessionId] = useState(createSessionId);
  const [connectionStatus, setConnectionStatus] = useState("waiting");
  const [scanHistory, setScanHistory] = useState([]);
  const [lastScan, setLastScan] = useState("");
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputValue]);

  useEffect(() => {
    const sessionRef = ref(db, `scan/${sessionId}`);
    const listQuery = query(sessionRef, limitToLast(100));

    const unsubValue = onValue(listQuery, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setConnectionStatus("waiting");
        return;
      }
      setConnectionStatus("connected");
      const items = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setScanHistory(items.reverse());
      const latest = items[items.length - 1];
      if (latest?.code) {
        setLastScan(latest.code);
        setInputValue(latest.code);
      }
      const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=");
      audio.play().catch(() => { });
    });

    const unsubChild = onChildAdded(sessionRef, (snapshot) => {
      const item = snapshot.val();
      if (!item?.code) return;
      setConnectionStatus("connected");
      setLastScan(item.code);
      setInputValue(item.code);
      setScanHistory((prev) => [{ id: snapshot.key, ...item }, ...prev].slice(0, 100));
    });

    return () => {
      unsubValue();
      unsubChild();
    };
  }, [sessionId]);

  const targetUrl = useMemo(() => `${window.location.origin}/scan/${sessionId}`, [sessionId]);

  return (
    <main className="app-shell">
      <header>
        <h1>POS Real-time Scanner Dashboard</h1>
        <p>Status: <strong>{connectionStatus}</strong> (session {sessionId})</p>
      </header>

      <section className="panel">
        <h2>Scanner session</h2>
        <div className="qr-wrap">
          <QRCodeSVG value={targetUrl} size={180} />
          <p>Scan this from the phone camera:</p>
          <code>{targetUrl}</code>
        </div>
      </section>

      <section className="panel">
        <h2>Live input</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!inputValue) return;
            console.log("Form submitted code", inputValue);
            setInputValue("");
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
            placeholder="Waiting for code..."
          />
          <button type="submit">Submit</button>
        </form>
        <p>Last scanned: <strong>{lastScan || "none yet"}</strong></p>
      </section>

      <section className="panel">
        <h2>Scan history</h2>
        <ul className="history-list">
          {scanHistory.length === 0 ? (<li>No scans yet.</li>) : scanHistory.map((item) => (
            <li key={item.id}>
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              <strong>{item.code}</strong>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Scanner({ sessionId }) {
  const [status, setStatus] = useState("starting");
  const [lastCode, setLastCode] = useState("");
  const lastScanRef = useRef({ code: null, ts: 0 });
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("missing session id");
      return;
    }

    const qrRegionId = "html5qr-scanner";
    const scanner = new Html5Qrcode(qrRegionId);
    html5QrCodeRef.current = scanner;

    const tryPush = async (code) => {
      const now = Date.now();
      const last = lastScanRef.current;
      if (last.code === code && now - last.ts < 3000) {
        return;
      }
      lastScanRef.current = { code, ts: now };

      const newRef = push(child(ref(db), `scan/${sessionId}`));
      try {
        await set(newRef, { code, timestamp: now });
        setLastCode(code);
        setStatus("scanned");
      } catch (error) {
        console.error("Failed to push scan", error);
        setStatus("firebase write failed");
      }
    };

    const onScanSuccess = (decodedText) => {
      if (!decodedText) return;
      setStatus("detected");
      tryPush(decodedText);
    };

    const onScanFailure = (_error) => {
      // Ignore, but keep status updated occasionally.
      setStatus("scanning...");
    };

    scanner
      .start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccess, onScanFailure)
      .then(() => setStatus("ready"))
      .catch((err) => {
        console.error("Camera init failed", err);
        setStatus("camera init failed");
      });

    return () => {
      scanner.stop().catch(() => { });
      scanner.clear().catch(() => { });
    };
  }, [sessionId]);

  return (
    <main className="app-shell">
      <header>
        <h1>Phone Scanner</h1>
        <p>Session: {sessionId}</p>
        <p>Status: <strong>{status}</strong></p>
      </header>

      <section className="panel">
        <div id="html5qr-scanner" className="scanner"></div>
        <p>Last scanned code: <strong>{lastCode || "none"}</strong></p>
      </section>

      <section className="panel">
        <p>Scan any barcode / QR code to send to dashboard in real time.</p>
        <a href="/" className="button">Return to dashboard</a>
      </section>
    </main>
  );
}

export default function App() {
  const routeSession = getSessionIdFromPath();

  return routeSession ? <Scanner sessionId={routeSession} /> : <Dashboard />;
}

