import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, Loader2, X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

// ── Canvas crop helper ──────────────────────────────────────────────────────────

interface CropArea { x: number; y: number; width: number; height: number; }

async function getCroppedBlob(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src     = imageSrc;
  });
  const canvas = document.createElement('canvas');
  const SIZE = 256;
  canvas.width = canvas.height = SIZE;
  canvas.getContext('2d')!.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, SIZE, SIZE,
  );
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas is empty'))), 'image/jpeg', 0.92),
  );
}

// ── Component ───────────────────────────────────────────────────────────────────

interface Props { onClose: () => void; }

export function AvatarUploadModal({ onClose }: Props) {
  const { user } = useAuthStore();

  // Config fetched from server at runtime (avoids Vite build-time env var issues)
  const [cloudName,    setCloudName]    = useState('');
  const [uploadPreset, setUploadPreset] = useState('onyx_avatars');

  const [imageSrc,    setImageSrc]    = useState<string | null>(null);
  const [crop,        setCrop]        = useState({ x: 0, y: 0 });
  const [zoom,        setZoom]        = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // GET /community/config is public — returns cloudinaryCloudName at runtime
    apiClient.get('/community/config')
      .then(({ data }) => {
        if (data.cloudinaryCloudName)    setCloudName(data.cloudinaryCloudName);
        if (data.cloudinaryUploadPreset) setUploadPreset(data.cloudinaryUploadPreset);
      })
      .catch(() => setError('Could not load config from server. Try again.'));
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8_000_000) { setError('File too large — max 8 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: unknown, croppedPixels: CropArea) => {
    setCroppedArea(croppedPixels);
  }, []);

  const handleUpload = async () => {
    if (!imageSrc || !croppedArea) return;
    if (!cloudName) {
      setError('No Cloudinary config received from server. Check VITE_CLOUDINARY_URL env var on Railway.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      const form = new FormData();
      form.append('file',          blob, 'avatar.jpg');
      form.append('upload_preset', uploadPreset);
      form.append('folder',        'onyx/avatars');

      const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Upload failed');

      const { data } = await apiClient.patch('/auth/me/avatar', { avatarUrl: json.secure_url });
      useAuthStore.setState((s) => ({ ...s, user: { ...s.user!, avatarUrl: data.avatarUrl } }));
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 420, background: 'var(--color-elevated)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>Change Avatar</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {!imageSrc ? (
            <div
              onClick={() => fileRef.current?.click()}
              style={{ height: 220, border: '2px dashed rgba(139,124,248,0.35)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', background: 'rgba(139,124,248,0.04)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139,124,248,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(139,124,248,0.35)')}
            >
              <Upload size={32} style={{ color: 'var(--color-accent)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Click to upload</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '4px 0 0' }}>JPG, PNG, WebP — max 8 MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            </div>
          ) : done ? (
            <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(62,207,142,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={28} style={{ color: 'var(--color-online)' }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Avatar updated!</p>
            </div>
          ) : (
            <div style={{ position: 'relative', height: 280, borderRadius: 10, overflow: 'hidden', background: '#111' }}>
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
                onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
          )}

          {/* Zoom slider */}
          {imageSrc && !done && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <ZoomOut size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
              <input type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-accent)' }} />
              <ZoomIn size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
            </div>
          )}

          {error && (
            <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 10, background: 'rgba(240,64,64,0.08)', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </p>
          )}

          {/* Actions */}
          {imageSrc && !done && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setImageSrc(null); setError(''); setZoom(1); }} className="btn-secondary" style={{ flex: 1 }}>
                Choose different
              </button>
              <button onClick={handleUpload} disabled={uploading || !cloudName} className="btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
                {uploading ? 'Uploading…' : 'Save Avatar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
