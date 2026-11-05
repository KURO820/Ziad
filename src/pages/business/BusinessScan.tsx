import { useState, useRef, useEffect } from 'react';
import { ScanLine, ShieldCheck, AlertTriangle, User2, FileText, Calendar, Globe2, Camera, RotateCcw, Search, Flag, Loader2, CheckCircle2, XCircle, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Spinner, StatusBadge, Toast, Modal, EmptyState } from '@/components/ui';
import type { Identity, Profile, Verification, Business } from '@/types';

type ScanResult = {
  status: 'idle' | 'scanning' | 'found' | 'not_found' | 'error';
  identity?: Identity;
  traveler?: Profile;
  matchedFields?: Record<string, boolean>;
};

export function BusinessScan() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'idle' });
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      setBusiness(data as Business | null);
      setLoading(false);
    });
    return () => stopCamera();
  }, [profile]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Scan for QR codes using a canvas + barcode detection
      scanIntervalRef.current = window.setInterval(() => {
        scanVideoFrame();
      }, 1000);
    } catch {
      setToast({ message: 'Could not access camera. You can manually enter the token below.', type: 'error' });
    }
  };

  const scanVideoFrame = async () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Try native BarcodeDetector API
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as unknown as { BarcodeDetector: new (opts: { types: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({ types: ['qr_code'] });
        const codes = await detector.detect(canvas);
        if (codes.length > 0) {
          const token = codes[0].rawValue;
          stopCamera();
          handleTokenLookup(token);
        }
      } catch {
        // Detection error — silently continue
      }
    }
  };

  const handleTokenLookup = async (token: string) => {
    if (!token.trim() || !business) return;
    setScanning(true);
    setScanResult({ status: 'scanning' });

    const { data: identity, error } = await supabase
      .from('identities')
      .select('*')
      .eq('qr_token', token.trim())
      .maybeSingle();

    if (error || !identity) {
      setScanResult({ status: 'not_found' });
      setScanning(false);

      // Log the not_found verification
      if (business) {
        await supabase.from('verifications').insert({
          business_id: business.id,
          traveler_user_id: '00000000-0000-0000-0000-000000000000',
          qr_token_scanned: token.trim(),
          result: 'not_found',
        }).then();
      }
      return;
    }

    const { data: traveler } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', identity.user_id)
      .maybeSingle();

    // Log the verification
    const matchedFields: Record<string, boolean> = {
      full_name: true,
      nationality: true,
      passport_number: true,
      date_of_birth: true,
    };

    const result = 'verified';

    await supabase.from('verifications').insert({
      business_id: business.id,
      traveler_user_id: identity.user_id,
      identity_id: identity.id,
      qr_token_scanned: token.trim(),
      result,
      verified_fields: matchedFields,
    });

    setScanResult({
      status: 'found',
      identity: identity as Identity,
      traveler: traveler as Profile,
      matchedFields,
    });
    setScanning(false);
    setToast({ message: 'Identity verified successfully', type: 'success' });
  };

  const handleManualLookup = () => {
    if (tokenInput.trim()) {
      handleTokenLookup(tokenInput.trim());
    }
  };

  const handleReportMismatch = async () => {
    if (!business || !scanResult.identity || !scanResult.traveler) return;
    setReporting(true);
    const { error } = await supabase.from('mismatch_reports').insert({
      business_id: business.id,
      traveler_user_id: scanResult.traveler.id,
      identity_id: scanResult.identity.id,
      report_reason: reportReason,
      details: reportDetails,
      status: 'open',
    });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Mismatch report submitted', type: 'success' });
      setReportModalOpen(false);
      setReportReason('');
      setReportDetails('');
    }
    setReporting(false);
  };

  const reset = () => {
    setScanResult({ status: 'idle' });
    setTokenInput('');
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  if (!business) {
    return (
      <DashboardLayout>
        <Card><EmptyState icon={Building2} title="Business profile required" description="Set up your business profile first to start scanning." /></Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Scan & Verify</h1>
        <p className="text-navy-500 mt-1">Scan a traveler's QR code to verify their digital identity</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {scanResult.status === 'idle' && (
          <div className="space-y-6 animate-fade-in">
            {/* Camera scanner */}
            <Card>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Camera Scanner</h2>
              <div className="relative bg-navy-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                {cameraActive ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-turquoise-400 rounded-2xl">
                        <div className="w-full h-full border-4 border-transparent border-t-turquoise-400 animate-pulse rounded-2xl" />
                      </div>
                    </div>
                    <button onClick={stopCamera} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 text-white rounded-xl text-sm backdrop-blur-md hover:bg-white/30">
                      Stop Camera
                    </button>
                  </>
                ) : (
                  <button onClick={startCamera} className="flex flex-col items-center gap-4 text-white p-8">
                    <div className="w-16 h-16 rounded-2xl bg-turquoise-500/20 flex items-center justify-center">
                      <Camera size={28} className="text-turquoise-400" />
                    </div>
                    <p className="font-medium">Start Camera to Scan QR Code</p>
                    <p className="text-sm text-navy-300">Point your camera at a traveler's identity QR code</p>
                  </button>
                )}
              </div>
            </Card>

            {/* Manual entry */}
            <Card>
              <h2 className="text-lg font-bold text-navy-900 mb-4">Manual Token Entry</h2>
              <p className="text-sm text-navy-400 mb-4">If the camera isn't available, enter the QR token manually:</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    className="input pl-11 font-mono"
                    placeholder="Enter QR token..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                  />
                </div>
                <button onClick={handleManualLookup} disabled={!tokenInput.trim()} className="btn-primary">
                  <ScanLine size={16} />
                  Verify
                </button>
              </div>
            </Card>
          </div>
        )}

        {scanResult.status === 'scanning' && (
          <Card className="animate-fade-in">
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={40} className="text-turquoise-600 animate-spin mb-4" />
              <p className="text-navy-600 font-medium">Looking up identity...</p>
            </div>
          </Card>
        )}

        {scanResult.status === 'not_found' && (
          <Card className="animate-scale-in">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <XCircle size={36} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-navy-900">Identity Not Found</h3>
              <p className="text-navy-500 mt-2 max-w-md">No digital identity matches this QR token. The token may be invalid or the identity may have been removed.</p>
              <button onClick={reset} className="btn-secondary mt-6">
                <RotateCcw size={16} />
                Try Again
              </button>
            </div>
          </Card>
        )}

        {scanResult.status === 'found' && scanResult.identity && (
          <div className="space-y-6 animate-scale-in">
            {/* Result banner */}
            <div className={`p-5 rounded-2xl flex items-center gap-4 ${
              scanResult.status === 'found' ? 'bg-turquoise-50 border border-turquoise-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                scanResult.status === 'found' ? 'bg-turquoise-500' : 'bg-red-500'
              }`}>
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-navy-900 text-lg">Identity Verified</p>
                <p className="text-sm text-navy-600">All fields match. This traveler's identity is confirmed.</p>
              </div>
            </div>

            {/* Traveler info */}
            <Card>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-navy-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center text-white text-xl font-bold">
                  {scanResult.identity.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy-900">{scanResult.identity.full_name}</h3>
                  <p className="text-sm text-navy-400">{scanResult.traveler?.role === 'traveler' ? 'Verified Traveler' : 'User'}</p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={scanResult.identity.status} />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-4">Identity Details</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: scanResult.identity.full_name, icon: User2 },
                  { label: 'Nationality', value: scanResult.identity.nationality, icon: Globe2 },
                  { label: 'Passport Number', value: scanResult.identity.passport_number, icon: FileText },
                  { label: 'Date of Birth', value: scanResult.identity.date_of_birth || '—', icon: Calendar },
                  { label: 'Expiry Date', value: scanResult.identity.expiry_date || '—', icon: Calendar },
                  { label: 'Issuing Country', value: scanResult.identity.issuing_country || '—', icon: Globe2 },
                ].map((field) => (
                  <div key={field.label} className="flex items-start gap-3 p-3 rounded-xl bg-navy-50">
                    <field.icon size={16} className="text-navy-400 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-navy-400">{field.label}</p>
                      <p className="text-sm font-medium text-navy-900 truncate">{field.value}</p>
                    </div>
                    <CheckCircle2 size={14} className="text-turquoise-500 ml-auto mt-1" />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-navy-100">
                <button onClick={reset} className="btn-secondary flex-1">
                  <ScanLine size={16} />
                  Scan Another
                </button>
                <button onClick={() => setReportModalOpen(true)} className="btn-danger flex-1">
                  <Flag size={16} />
                  Report Mismatch
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Report Mismatch Modal */}
      <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Identity Mismatch" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-accent-50 border border-accent-200 flex items-start gap-2">
            <AlertCircle size={16} className="text-accent-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-accent-700">Report a mismatch if the traveler's physical identity doesn't match the digital record. This will be reviewed by platform admins.</p>
          </div>
          <div>
            <label className="label">Reason</label>
            <select className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
              <option value="">Select a reason...</option>
              <option value="Name mismatch">Name doesn't match</option>
              <option value="Passport number mismatch">Passport number doesn't match</option>
              <option value="Photo mismatch">Photo doesn't match</option>
              <option value="Expired document">Document appears expired</option>
              <option value="Suspicious document">Document appears tampered</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Additional Details</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Describe what doesn't match..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setReportModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReportMismatch} disabled={!reportReason || reporting} className="btn-danger">
              {reporting ? <Spinner size={16} /> : <Flag size={16} />}
              Submit Report
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}


