import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanLine, Upload, FileText, CheckCircle2, AlertCircle, Save, RotateCcw, Camera, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Spinner, Toast } from '@/components/ui';
import type { OCRResult, Identity } from '@/types';

export function TravelerScan() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'saved'>('upload');
  const [ocrData, setOcrData] = useState<OCRResult>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setStep('processing');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setImagePreview(e.target?.result as string);

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-passport`;
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ image_base64: base64 }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.error === 'OCR_NOT_CONFIGURED') {
            setError(result.message || 'OCR service is not configured. You can enter your passport details manually below.');
            setOcrData({});
            setStep('review');
          } else {
            setError(result.error || 'Failed to scan passport. Please try again or enter details manually.');
            setStep('review');
            setOcrData({});
          }
          return;
        }

        setOcrData(result as OCRResult);
        setStep('review');
      } catch {
        setError('Network error. Please try again or enter your passport details manually.');
        setStep('review');
        setOcrData({});
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const existing = await supabase.from('identities').select('id').eq('user_id', profile.id).maybeSingle();
    if (existing.data) {
      setError('You already have an identity card. Please edit it from the Identity page instead of creating a new one.');
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from('identities')
      .insert({
        user_id: profile.id,
        full_name: ocrData.full_name || profile.full_name,
        nationality: ocrData.nationality || '',
        passport_number: ocrData.passport_number || '',
        passport_type: ocrData.passport_type || null,
        date_of_birth: ocrData.date_of_birth || null,
        gender: ocrData.gender || null,
        place_of_birth: ocrData.place_of_birth || null,
        issue_date: ocrData.issue_date || null,
        expiry_date: ocrData.expiry_date || null,
        issuing_country: ocrData.issuing_country || null,
        document_type: ocrData.document_type || 'passport',
      })
      .select()
      .maybeSingle();

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setToast({ message: 'Digital identity created successfully!', type: 'success' });
    setSaving(false);
    setStep('saved');
    setTimeout(() => navigate('/traveler/identity'), 1500);
  };

  const reset = () => {
    setStep('upload');
    setOcrData({});
    setImagePreview('');
    setError(null);
  };

  const fields: { key: keyof OCRResult; label: string; type?: string }[] = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'passport_number', label: 'Passport Number' },
    { key: 'passport_type', label: 'Passport Type' },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { key: 'gender', label: 'Gender' },
    { key: 'place_of_birth', label: 'Place of Birth' },
    { key: 'issue_date', label: 'Issue Date', type: 'date' },
    { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
    { key: 'issuing_country', label: 'Issuing Country' },
  ];

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Scan Passport</h1>
        <p className="text-navy-500 mt-1">Upload a photo of your passport to extract information automatically</p>
      </div>

      {/* OCR configuration notice */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Passport OCR Setup</p>
          <p className="mt-1 text-blue-700">
            Passport scanning uses Google Cloud Vision API for real OCR text extraction. If the API key is not configured, you can still manually enter your passport details. See the setup note below the scan area.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {step === 'upload' && (
          <Card className="animate-fade-in">
            <div
              className="border-2 border-dashed border-navy-200 rounded-2xl p-12 text-center hover:border-turquoise-400 hover:bg-turquoise-50/30 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-turquoise-500 to-turquoise-700 flex items-center justify-center mx-auto mb-6">
                <ScanLine size={36} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">Upload your passport photo</h3>
              <p className="text-navy-500 mt-2 max-w-md mx-auto">
                Drag and drop a clear photo of your passport's data page, or click to browse. The photo page with your photo and MRZ text works best.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
                  <Upload size={18} />
                  Choose File
                </button>
                <button onClick={() => cameraInputRef.current?.click()} className="btn-secondary">
                  <Camera size={18} />
                  Take Photo
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            <div className="mt-6 p-4 rounded-xl bg-navy-50 border border-navy-100">
              <p className="text-xs text-navy-500 font-medium mb-2">OCR Configuration (for developers/admins):</p>
              <p className="text-xs text-navy-400 font-mono">Set the <code className="text-turquoise-600 font-semibold">GOOGLE_CLOUD_VISION_API_KEY</code> secret in Supabase Edge Functions to enable real passport OCR. Without it, users can enter passport details manually.</p>
            </div>
          </Card>
        )}

        {step === 'processing' && (
          <Card className="animate-fade-in">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-turquoise-500 to-turquoise-700 flex items-center justify-center mb-6">
                <Loader2 size={36} className="text-white animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">Scanning your passport...</h3>
              <p className="text-navy-500 mt-2">Extracting text using OCR technology</p>
              {imagePreview && (
                <img src={imagePreview} alt="Passport" className="mt-6 max-h-48 rounded-xl border border-navy-200" />
              )}
            </div>
          </Card>
        )}

        {step === 'review' && (
          <Card className="animate-fade-in">
            <div className="flex items-start gap-3 mb-6">
              {error ? (
                <AlertCircle size={20} className="text-accent-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={20} className="text-turquoise-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-lg font-bold text-navy-900">
                  {error ? 'Manual Entry Required' : 'Review Extracted Information'}
                </h3>
                <p className="text-sm text-navy-500 mt-1">
                  {error ? error : 'Please review the extracted data and correct any errors before saving.'}
                </p>
              </div>
            </div>

            {imagePreview && (
              <div className="mb-6 flex justify-center">
                <img src={imagePreview} alt="Passport" className="max-h-48 rounded-xl border border-navy-200" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    className="input"
                    value={(ocrData[field.key] as string) || ''}
                    onChange={(e) => setOcrData({ ...ocrData, [field.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button onClick={reset} className="btn-secondary">
                <RotateCcw size={16} />
                Re-scan
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <Spinner size={16} /> : <Save size={16} />}
                Save Identity
              </button>
            </div>
          </Card>
        )}

        {step === 'saved' && (
          <Card className="animate-scale-in">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-turquoise-100 flex items-center justify-center mb-6">
                <CheckCircle2 size={36} className="text-turquoise-600" />
              </div>
              <h3 className="text-xl font-bold text-navy-900">Identity Created!</h3>
              <p className="text-navy-500 mt-2">Redirecting to your identity card...</p>
              <Link to="/traveler/identity" className="btn-secondary mt-6">
                <FileText size={16} />
                View Identity Card
              </Link>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
