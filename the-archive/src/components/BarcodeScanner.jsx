
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X } from "lucide-react";

function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls;
    let active = true;

    async function startScanner() {
      try {
        const scannerControls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result && active) {
              active = false;
              scannerControls.stop();
              onScanRef.current(result.getText());
            }
          }
        );

        if (active) {
          controls = scannerControls;
        } else {
          scannerControls.stop();
        }
      } catch (err) {
        console.error("Barcode scanner error:", err);
        if (active) {
          setError(
            "We couldn't access your camera. Check your browser permissions and try again."
          );
        }
      }
    }

    startScanner();

    return () => {
      active = false;
      controls?.stop();
      reader.reset();
    };
  }, []);

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-heading">
          <div>
            <p className="eyebrow">BOOK SCANNER</p>
            <h2>Scan the ISBN barcode</h2>
          </div>
          <button
            type="button"
            className="scanner-close"
            onClick={onClose}
            aria-label="Close scanner"
          >
            <X size={20} />
          </button>
        </div>

        <div className="scanner-video-container">
          <video ref={videoRef} className="scanner-video" />
          <div className="scanner-guide" />
        </div>

        {error ? (
          <p className="scanner-error">{error}</p>
        ) : (
          <p className="scanner-instructions">
            Hold the barcode on the back of the book inside the frame.
          </p>
        )}

        <button
          type="button"
          className="cancel-button scanner-cancel"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default BarcodeScanner;
