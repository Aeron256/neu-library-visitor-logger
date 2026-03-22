import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { Camera, CameraOff, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [scanResult, setScanResult] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(console.error)
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  const startScanning = () => {
    setCameraError('');
    setScanning(true);
    setError('');
    setScanResult('');

    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          throw new Error('No camera devices found');
        }
        const cameraId = devices[0].id;
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;
        html5QrCode
          .start(
            cameraId,
            {
              fps: 15,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            (errorMessage) => {
              // Ignore frequent frame errors for better performance
            }
          )
          .catch((startErr) => {
            setCameraError(startErr.message || 'Access denied. Please check camera permissions.');
            setScanning(false);
          });
      })
      .catch((camerasErr) => {
        setCameraError(camerasErr.message || 'No camera available');
        setScanning(false);
      });
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => scannerRef.current.clear())
        .catch((err) => console.error(err))
        .finally(() => {
          scannerRef.current = null;
          setScanning(false);
        });
      return;
    }
    setScanning(false);
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      setScanResult(decodedText);
      await stopScanning();

      const schoolId = decodedText.trim();
      if (onScanSuccess) {
        await onScanSuccess(schoolId);
      }

      // Brief delay before resuming to prevent double-scans
      setTimeout(() => {
        startScanning();
      }, 1500);
    } catch (error) {
      setError(error.message || 'Verification failed');
      if (onScanError) onScanError(error);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${scanning ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">QR Station</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {scanning ? 'System Online' : 'System Standby'}
          </p>
        </div>
      </div>

      {!scanning ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-100">
              <RefreshCw className="w-6 h-6 text-slate-300" />
            </div>
          </div>
          <button
            onClick={startScanning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Activate Scanner
          </button>
          <p className="text-slate-400 mt-4 text-xs font-medium">
            Scan student QR codes for entry/exit
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative group">
            <div
              id="qr-reader"
              className="w-full mx-auto rounded-2xl overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200"
              style={{ maxHeight: '360px', minHeight: '280px', width: '100%' }}
            />
            {/* Viewfinder Corners Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent p-4">
               <div className="w-full h-full border-2 border-blue-400/30 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
               </div>
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2">
               <Loader2 className="w-3 h-3 text-white animate-spin" />
               <span className="text-[10px] text-white font-black uppercase tracking-widest">Live Scanning</span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={stopScanning}
              className="text-rose-600 hover:bg-rose-50 px-6 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 mx-auto"
            >
              <CameraOff className="w-4 h-4" />
              Disconnect Camera
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      <div className="mt-6 space-y-3">
        {scanResult && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-emerald-700 font-black text-sm uppercase tracking-tight">Access Logged</p>
              <p className="text-emerald-600/70 text-xs font-bold font-mono tracking-wider">{scanResult}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-rose-700 font-black text-sm uppercase tracking-tight">Scan Error</p>
              <p className="text-rose-600/70 text-xs font-bold">{error}</p>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-black text-sm uppercase tracking-tight">Hardware Error</span>
            </div>
            <p className="text-amber-600 text-xs font-bold leading-relaxed mb-3">{cameraError}</p>
            <button
              onClick={startScanning}
              className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest"
            >
              Re-initialize Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;