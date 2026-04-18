'use client';

import React, { useEffect, useState, Suspense, use } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';

const MapView = dynamic(() => import('@/components/MapView'), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', background: 'var(--card-bg)', borderRadius: '12px' }}></div>
});

const translations = {
  en: {
    logo: "Bezi Gar",
    tagline: "Directions for your pick-up.",
    spotTitle: "Pick-up Spot",
    openMaps: "Open in Google Maps",
    instrTitle: "Instructions",
    marksTitle: "Visual Landmarks",
    voiceTitle: "Voice Note",
    footer: "Delivered with Bezi Gar",
    error: "Error loading pin.",
    notFound: "Pin not found."
  },
  am: {
    logo: "በዚህ ጋር",
    tagline: "ለእርሶ መውሰጃ መመሪያዎች::",
    spotTitle: "መውሰጃ ቦታ",
    openMaps: "በጎግል ካርታ ክፈት",
    instrTitle: "መመሪያዎች",
    marksTitle: "ምስላዊ ምልክቶች",
    voiceTitle: "የድምፅ መልዕክት",
    footer: "በ 'በዚህ ጋር' የቀረበ",
    error: "መረጃውን መጫን አልተቻለም::",
    notFound: "መረጃው አልተገኘም::"
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

function PinViewContent({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lang, setLang] = useState<'en' | 'am'>('am');

  const supabase = createClient();
  const t = translations[lang];

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchPin = async () => {
      try {
        const { data: pin, error: fetchError } = await supabase
          .from('pins')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error("Fetch error:", fetchError);
          setError(t.error);
        } else if (!pin) {
          setError(t.notFound);
        } else {
          setData(pin);
        }
      } catch (err) {
        console.error("Catch error:", err);
        setError(t.error);
      }
    };

    if (id && id !== 'v') fetchPin();
  }, [id, t.error, t.notFound, supabase]);

  if (error) return <div className="container"><h1>Error</h1><p>{error}</p></div>;
  if (!data) return <div className="container"><h1>Loading...</h1></div>;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`;

  return (
    <main className="container">
      <div className="header-nav">
        <Logo lang={lang} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="theme-toggle-btn" onClick={() => setLang(lang === 'en' ? 'am' : 'en')}>
            {lang === 'en' ? 'አማርኛ' : 'English'}
          </button>
          <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p className="tagline">{t.tagline}</p>
      </div>
      
      <div className="card card-location">
        <h3>{t.spotTitle}</h3>
        <MapView lat={data.lat} lng={data.lng} />
        <a 
          href={googleMapsUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="button"
          style={{ display: 'block', textAlign: 'center' }}
        >
          {t.openMaps}
        </a>
      </div>

      {data.photos && data.photos.length > 0 && (
        <div className="card card-photos">
          <h3>{t.marksTitle}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {data.photos.map((url: string, i: number) => (
              <div key={i} style={{ position: 'relative' }}>
                <img 
                  src={url} 
                  alt={`Landmark ${i+1}`} 
                  className="clickable-img"
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)' }} 
                  onClick={() => window.open(url, '_blank')}
                />
                <div className="photo-number">{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.directions && (
        <div className="card card-directions">
          <h3>{t.instrTitle}</h3>
          <p style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>{data.directions}</p>
        </div>
      )}

      {data.audio && (
        <div className="card card-voice">
          <h3>{t.voiceTitle}</h3>
          <audio src={data.audio} controls style={{ width: '100%', filter: theme === 'dark' ? 'invert(1)' : 'none' }} />
        </div>
      )}

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
        {t.footer}
      </footer>
    </main>
  );
}

export default function PinView({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <PinViewContent id={resolvedParams.id} />
    </Suspense>
  );
}
