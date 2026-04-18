'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import VoiceRecorder from '@/components/VoiceRecorder';

const MapSelector = dynamic(() => import('@/components/MapSelector'), { 
  ssr: false,
  loading: () => <div style={{ height: '320px', background: 'var(--card-bg)', borderRadius: '12px' }}></div>
});

const translations = {
  en: {
    logo: "Bezi Gar",
    tagline: "Precise directions for your driver.",
    locTitle: "Pick your location",
    locSuccess: "Location set successfully",
    locWait: "Finding you...",
    dirTitle: "How to find you",
    dirPlaceholder: "Enter landmarks or gate descriptions...",
    imgTitle: "Visual markers",
    imgDesc: "Add photos of your gate or street.",
    imgBtn: "Add Photo",
    voiceTitle: "Voice instructions",
    generateBtn: "Generate Pickup Link",
    readyTitle: "Ready to Share",
    readyDesc: "Send this to your driver through your ride app chat.",
    copyBtn: "Copy Link",
    dismissBtn: "Dismiss",
    copied: "Copied to clipboard!",
    pickLocAlert: "Please pick your location on the map first.",
    saving: "Creating your pin..."
  },
  am: {
    logo: "በዚህ ጋር",
    tagline: "ለሹፌሩ ትክክለኛ መመሪያ ይላኩ።",
    locTitle: "ያሉበትን ቦታ ይምረጡ",
    locSuccess: "ቦታው በትክክል ተመርጧል",
    locWait: "በመፈለግ ላይ...",
    dirTitle: "እንዴት ያገኙዎታል?",
    dirPlaceholder: "መለያ ምልክቶችን ወይም የበር መግለጫዎችን ያስገቡ...",
    imgTitle: "ምስላዊ ምልክቶች",
    imgDesc: "የበርዎን ወይም የመንገዱን ፎቶዎች ያክሉ::",
    imgBtn: "ፎቶ ጨምር",
    voiceTitle: "የድምፅ መመሪያ",
    generateBtn: "የመውሰጃ ሊንክ ፍጠር",
    readyTitle: "ለመላክ ተዘጋጅቷል",
    readyDesc: "ይህንን ለሹፌሩ በራይድ አፕ ቻት ውስጥ ይላኩለት።",
    copyBtn: "ሊንኩን ቅዳ",
    dismissBtn: "አጥፋ",
    copied: "ተቀድቷል!",
    pickLocAlert: "እባክዎን መጀመሪያ ካርታው ላይ ያሉበትን ቦታ ይምረጡ::",
    saving: "ሊንኩ በመፈጠር ላይ ነው..."
  }
};

const Logo = ({ lang }: { lang: 'en' | 'am' }) => (
  <div className="logo-container">
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 24V8H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 24L24 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
    </svg>
    <span className="logo-text">{translations[lang].logo}</span>
  </div>
);

const PhotoPreview = ({ file, index, onDelete }: { file: File, index: number, onDelete: () => void }) => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <div className="photo-item" style={{ background: 'var(--border)' }} />;

  return (
    <div className="photo-item">
      <img src={url} alt={`Landmark ${index + 1}`} />
      <div className="photo-number">{index + 1}</div>
      <button 
        className="photo-delete" 
        onClick={onDelete}
        aria-label="Delete photo"
      >
        ×
      </button>
    </div>
  );
};

export default function Home() {
  const [lang, setLang] = useState<'en' | 'am'>('am');
  const [directions, setDirections] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const supabase = createClient();
  const t = translations[lang];

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(lang === 'en' ? 'am' : 'en');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (photoFiles.length >= 10) return;
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFiles(prev => [...prev, file]);
    }
    e.target.value = '';
  };

  const handleShare = async () => {
    if (!location) {
      alert(t.pickLocAlert);
      return;
    }

    setIsSaving(true);

    try {
      const pinId = crypto.randomUUID();
      const photoUrls: string[] = [];

      // Upload Photos
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const path = `${pinId}/photo_${i}.jpg`;
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
          photoUrls.push(publicUrl);
        }
      }

      // Upload Audio
      let audioUrl = null;
      if (audioBlob) {
        const path = `${pinId}/voice.webm`;
        const { error: audioError } = await supabase.storage.from('media').upload(path, audioBlob);
        if (!audioError) {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
          audioUrl = publicUrl;
        }
      }

      // Save Pin Metadata
      const { error: dbError } = await supabase.from('pins').insert({
        id: pinId,
        lat: location.lat,
        lng: location.lng,
        directions,
        photos: photoUrls,
        audio: audioUrl
      });

      if (dbError) throw dbError;

      setShareUrl(`${window.location.origin}/p/v/${pinId}`);
    } catch (err) {
      console.error(err);
      alert("Error saving pin. Check Supabase connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="container">
      <div className="header-nav">
        <Logo lang={lang} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="theme-toggle-btn" onClick={toggleLang}>
            {lang === 'en' ? 'አማርኛ' : 'English'}
          </button>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p className="tagline">{t.tagline}</p>
      </div>

      <div className="card card-location">
        <h3>{t.locTitle}</h3>
        <MapSelector onLocationSelect={setLocation} />
        {location ? (
          <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'var(--accent-loc)', fontWeight: 500 }}>
            {t.locSuccess}
          </p>
        ) : (
          <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'var(--muted)' }}>
            {t.locWait}
          </p>
        )}
      </div>

      <div className="card card-directions">
        <h3>{t.dirTitle}</h3>
        <textarea 
          className="input" 
          placeholder={t.dirPlaceholder}
          rows={2}
          value={directions}
          onChange={(e) => setDirections(e.target.value)}
        />
      </div>

      <div className="card card-photos">
        <h3>{t.imgTitle}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{t.imgDesc}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--accent-img)', marginBottom: '1rem', fontWeight: 500 }}>
          {lang === 'en' ? 'Photos will be shown in this order.' : 'ፎቶዎቹ በሚታዩበት ቅደም ተከተል ይቀመጣሉ::'}
        </p>
        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} id="photo-upload" />
        <label htmlFor="photo-upload" className="button-outline" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
          {t.imgBtn} ({photoFiles.length}/10)
        </label>
        
        <div className="photo-grid">
          {photoFiles.map((f, i) => (
            <PhotoPreview key={`${f.name}-${i}`} file={f} index={i} onDelete={() => setPhotoFiles(prev => prev.filter((_, index) => index !== i))} />
          ))}
        </div>
      </div>

      <div className="card card-voice">
        <h3>{t.voiceTitle}</h3>
        <VoiceRecorder onAudioSave={(blob) => setAudioBlob(blob)} isRawBlob={true} />
      </div>

      <button className="button" onClick={handleShare} disabled={isSaving}>
        {isSaving ? t.saving : t.generateBtn}
      </button>

      {shareUrl && (
        <div className="card card-success" style={{ marginTop: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h2>{t.readyTitle}</h2>
          <p style={{ marginBottom: '2rem' }}>{t.readyDesc}</p>
          
          <button 
            className="button" 
            style={{ marginBottom: '1rem' }}
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              alert(t.copied);
            }}
          >
            {t.copyBtn}
          </button>
          
          <button 
            className="button-outline" 
            style={{ fontSize: '0.8rem' }}
            onClick={() => setShareUrl(null)}
          >
            {t.dismissBtn}
          </button>
        </div>
      )}
    </main>
  );
}
