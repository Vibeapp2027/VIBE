import { useEffect, useMemo, useRef, useState } from 'react';
import { appConfig } from './config';

const SERVICE_STATE = {
  UNCONFIGURED: 'non configuré',
  CHECKING: 'vérification en cours',
  UP: 'opérationnel',
  DOWN: 'indisponible',
};

const STATUS_CLASSNAMES = {
  [SERVICE_STATE.UNCONFIGURED]: 'bg-slate-500',
  [SERVICE_STATE.CHECKING]: 'bg-amber-400 animate-pulse',
  [SERVICE_STATE.UP]: 'bg-emerald-400',
  [SERVICE_STATE.DOWN]: 'bg-rose-500',
};

const SHOP_ITEMS = [
  {
    id: '1',
    title: 'Abonnement VIP VIBE',
    description: 'Accès illimité au salon audio HD et fonctionnalités avancées du Mode Fantôme.',
    price: '9.99 $ / mois',
    routeLabel: '/boutique/vip',
    isExternal: false,
    badge: 'Populaire',
  },
  {
    id: '2',
    title: 'Passe Événement Pride 2026',
    description: 'Billet exclusif pour les rassemblements communautaires VIBE.',
    price: '24.99 $',
    routeLabel: '/boutique/pride-2026',
    isExternal: false,
    badge: 'Événement',
  },
  {
    id: '3',
    title: 'Boutique Partenaire LGBT+',
    description: 'Offres exclusives chez nos partenaires locaux certifiés au Québec.',
    price: 'Réductions',
    url: 'https://vibegay.ca/partenaires',
    isExternal: true,
    badge: 'Partenaire',
  },
];

const PRICE_PLANS = [
  { id: 'week', label: '1 semaine', price: '14 $', note: 'Accès découverte' },
  { id: 'month', label: '1 mois', price: '29 $', note: 'Accès standard' },
  { id: '3months', label: '3 mois', price: '69 $', note: 'Économie 20%' },
  { id: '6months', label: '6 mois', price: '119 $', note: 'Économie 30%' },
  { id: 'year', label: '1 an', price: '199 $', note: 'Accès annuel premium' },
  { id: 'boost', label: 'Boost profil', price: '9 $', note: 'Mise en avant 24h' },
];

const TRANSLATION_LANGUAGES = ['Français', 'English', 'Español', 'Português', 'Italiano', 'Deutsch', 'العربية', 'Türkçe', 'हिन्दी', 'Tagalog'];

const PROFILES = [
  { id: 'alex', name: 'Alex', mood: 'Chill lofi' },
  { id: 'sam', name: 'Sam', mood: 'Pride vibes' },
  { id: 'mika', name: 'Mika', mood: 'Night talk' },
];

const SOS_STATE = {
  IDLE: 'idle',
  SENDING: 'sending',
  SIMULATED: 'simulated',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
};

const MATCH_WINDOW_MS = 1800;
const FLASH_DURATION_MS = 500;

const isBrowser = typeof window !== 'undefined';

function parseGeoError(error) {
  if (!error) {
    return 'La localisation n’a pas pu être déterminée.';
  }

  switch (error.code) {
    case 1:
      return 'Permission de géolocalisation refusée.';
    case 2:
      return 'Position indisponible actuellement.';
    case 3:
      return 'Délai dépassé pour récupérer la position.';
    default:
      return 'La localisation n’a pas pu être déterminée.';
  }
}

function parseVolume(rawValue) {
  const next = Number(rawValue);
  if (Number.isNaN(next)) {
    return 0.8;
  }

  return Math.min(1, Math.max(0, next));
}

function toSafeExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

async function checkService(url, timeoutMs, signal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const linkedSignal = new AbortController();

  const abortLinked = () => linkedSignal.abort();
  signal?.addEventListener('abort', abortLinked, { once: true });
  timeoutController.signal.addEventListener('abort', abortLinked, { once: true });

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: linkedSignal.signal,
    });
    return response.ok ? SERVICE_STATE.UP : SERVICE_STATE.DOWN;
  } catch {
    return SERVICE_STATE.DOWN;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortLinked);
  }
}

export default function VibegayDashboard() {
  const [activeTab, setActiveTab] = useState('salon');
  const [ghostMode, setGhostMode] = useState(false);
  const [revealedProfiles, setRevealedProfiles] = useState({});
  const [angeModalOpen, setAngeModalOpen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [audioError, setAudioError] = useState('');
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [sosState, setSosState] = useState(SOS_STATE.IDLE);
  const [sosMessage, setSosMessage] = useState('');
  const sosResetTimerRef = useRef(null);

  const [networkOnline, setNetworkOnline] = useState(isBrowser ? window.navigator.onLine : true);
  const [shopNotice, setShopNotice] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [matchNotice, setMatchNotice] = useState('');
  const [isGlobalFlashVisible, setIsGlobalFlashVisible] = useState(false);
  const flashTimerRef = useRef(null);
  const matchTimerRef = useRef(null);
  const lastProfileClickRef = useRef({ id: '', at: 0 });

  const [serviceStatus, setServiceStatus] = useState({
    api: appConfig.apiHealthUrl ? SERVICE_STATE.CHECKING : SERVICE_STATE.UNCONFIGURED,
    supabase: appConfig.supabaseHealthUrl ? SERVICE_STATE.CHECKING : SERVICE_STATE.UNCONFIGURED,
    loi25: appConfig.loi25PolicyUrl ? SERVICE_STATE.CHECKING : SERVICE_STATE.UNCONFIGURED,
    translation: appConfig.translationHealthUrl ? SERVICE_STATE.CHECKING : SERVICE_STATE.UNCONFIGURED,
    voice: appConfig.voiceHealthUrl ? SERVICE_STATE.CHECKING : SERVICE_STATE.UNCONFIGURED,
  });

  const freeRemaining = Math.max(0, appConfig.freeRegistrationsLimit - appConfig.freeRegistrationsUsed);
  const paidRemaining = Math.max(0, appConfig.yearlyPaidTicketsLimit - appConfig.yearlyPaidTicketsSold);

  useEffect(() => {
    const currentAudio = audioRef.current;
    if (!currentAudio) {
      return undefined;
    }

    currentAudio.volume = volume;

    return () => {
      currentAudio.pause();
    };
  }, [volume]);

  useEffect(() => {
    if (!isBrowser) {
      return undefined;
    }

    const onOnline = () => setNetworkOnline(true);
    const onOffline = () => setNetworkOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const checkController = new AbortController();

    const performChecks = async () => {
      const checks = [
        ['api', appConfig.apiHealthUrl],
        ['supabase', appConfig.supabaseHealthUrl],
        ['loi25', appConfig.loi25PolicyUrl],
        ['translation', appConfig.translationHealthUrl],
        ['voice', appConfig.voiceHealthUrl],
      ];

      for (const [key, url] of checks) {
        if (!url) {
          continue;
        }

        setServiceStatus((previous) => ({
          ...previous,
          [key]: SERVICE_STATE.CHECKING,
        }));

        const nextStatus = await checkService(url, appConfig.healthTimeoutMs, checkController.signal);
        if (checkController.signal.aborted) {
          return;
        }

        setServiceStatus((previous) => ({
          ...previous,
          [key]: nextStatus,
        }));
      }
    };

    performChecks();

    return () => {
      checkController.abort();
    };
  }, []);

  useEffect(() => () => {
    if (sosResetTimerRef.current) {
      clearTimeout(sosResetTimerRef.current);
    }
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    if (matchTimerRef.current) {
      clearTimeout(matchTimerRef.current);
    }
  }, []);

  const globalSystemStatus = useMemo(() => {
    const values = Object.values(serviceStatus);

    if (values.includes(SERVICE_STATE.DOWN)) {
      return SERVICE_STATE.DOWN;
    }

    if (values.includes(SERVICE_STATE.CHECKING)) {
      return SERVICE_STATE.CHECKING;
    }

    if (values.every((state) => state === SERVICE_STATE.UNCONFIGURED)) {
      return SERVICE_STATE.UNCONFIGURED;
    }

    return SERVICE_STATE.UP;
  }, [serviceStatus]);

  const toggleAudio = async () => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      setAudioError('Lecteur audio indisponible sur cet appareil.');
      return;
    }

    try {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        await audioElement.play();
        setAudioError('');
        setIsPlaying(true);
      }
    } catch {
      setAudioError('Lecture bloquée par le navigateur. Cliquez à nouveau pour autoriser l’audio.');
      setIsPlaying(false);
    }
  };

  const playWhisperEffect = () => {
    if (!isBrowser) {
      setProfileNotice('Effet chuchotement non disponible hors navigateur.');
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setProfileNotice('Effet chuchotement non supporté sur ce navigateur.');
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(420, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.onended = () => {
      context.close();
    };
  };

  const handleProfileClick = (profile) => {
    playWhisperEffect();
    setProfileNotice(`Profil ${profile.name}: chuchotement local activé.`);

    const now = Date.now();
    const previous = lastProfileClickRef.current;
    if (previous.id && previous.id !== profile.id && now - previous.at <= MATCH_WINDOW_MS) {
      setIsGlobalFlashVisible(true);
      setMatchNotice(`Match détecté entre ${previous.id} et ${profile.name} (simulation locale).`);

      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      flashTimerRef.current = setTimeout(() => setIsGlobalFlashVisible(false), FLASH_DURATION_MS);

      if (matchTimerRef.current) {
        clearTimeout(matchTimerRef.current);
      }
      matchTimerRef.current = setTimeout(() => setMatchNotice(''), 3500);
    }

    lastProfileClickRef.current = { id: profile.name, at: now };
  };

  const toggleRevealProfile = (profileId) => {
    setRevealedProfiles((previous) => ({
      ...previous,
      [profileId]: !previous[profileId],
    }));
  };

  const triggerModeAnge = () => {
    setAngeModalOpen(true);
    setGeoError('');
    setSosState(SOS_STATE.IDLE);
    setSosMessage('');
    setLocation(null);

    if (!isBrowser || !window.navigator.geolocation) {
      setGeoError('Géolocalisation indisponible sur cet appareil.');
      return;
    }

    setIsLocating(true);

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude.toFixed(5),
          lng: position.coords.longitude.toFixed(5),
        });
        setIsLocating(false);
      },
      (error) => {
        setGeoError(parseGeoError(error));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: appConfig.geoTimeoutMs,
        maximumAge: 0,
      },
    );
  };

  const handleCloseModal = () => {
    setAngeModalOpen(false);
    setIsLocating(false);
  };

  const handleSendSOS = async () => {
    if (!appConfig.sosApiUrl) {
      setSosState(SOS_STATE.SIMULATED);
      setSosMessage('Mode simulé actif: aucun backend SOS configuré, aucun signal réel transmis.');
      return;
    }

    setSosState(SOS_STATE.SENDING);
    setSosMessage('Transmission en cours...');

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), appConfig.sosTimeoutMs);

    try {
      const response = await fetch(appConfig.sosApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'sos',
          timestamp: new Date().toISOString(),
          location,
        }),
        signal: timeoutController.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.confirmed === true) {
        setSosState(SOS_STATE.CONFIRMED);
        setSosMessage('Signal SOS confirmé par le backend.');
        sosResetTimerRef.current = setTimeout(() => {
          setSosState(SOS_STATE.IDLE);
          setSosMessage('');
          setAngeModalOpen(false);
        }, 3000);
        return;
      }

      setSosState(SOS_STATE.FAILED);
      setSosMessage('Aucune confirmation backend reçue: SOS non confirmé.');
    } catch {
      setSosState(SOS_STATE.FAILED);
      setSosMessage('Échec réseau ou délai dépassé: SOS non transmis.');
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${ghostMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-900 text-white'}`}>
      {isGlobalFlashVisible && <div className="fixed inset-0 bg-white/70 z-50 pointer-events-none" />}

      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-pink-500/20">
            V
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">vibegay.ca</h1>
            <span className="text-xs text-slate-400 block">Espace Communautaire Micro-SaaS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setGhostMode(!ghostMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition ${
              ghostMode ? 'bg-purple-950/80 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>👻</span>
            <span>{ghostMode ? 'Mode Fantôme Actif' : 'Activer Mode Fantôme'}</span>
          </button>

          <button
            onClick={triggerModeAnge}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg shadow-rose-600/30 transition"
          >
            <span>🛡️</span>
            <span>MODE ANGE (SOS)</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CLASSNAMES[globalSystemStatus]}`} />
            <span className="font-semibold">Statut global: {globalSystemStatus}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <span>Réseau navigateur: <strong>{networkOnline ? 'opérationnel' : 'indisponible'}</strong></span>
            <span>API Healthcheck: <strong>{serviceStatus.api}</strong></span>
            <span>Supabase: <strong>{serviceStatus.supabase}</strong></span>
            <span>Loi 25 (page politique): <strong>{serviceStatus.loi25}</strong></span>
            <span>Traduction temps réel (10 langues): <strong>{serviceStatus.translation}</strong></span>
            <span>Salon voix temps réel: <strong>{serviceStatus.voice}</strong></span>
          </div>
          <p className="text-[11px] text-slate-400">Les statuts affichent des vérifications réelles seulement si les variables `VITE_*` correspondantes sont configurées.</p>
        </div>

        <div className="flex border-b border-slate-800 mb-8 gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('salon')}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
              activeTab === 'salon' ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎵 Salon Audio
          </button>
          <button
            onClick={() => setActiveTab('acces')}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
              activeTab === 'acces' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎟️ Accès & Tarifs
          </button>
          <button
            onClick={() => setActiveTab('profils')}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
              activeTab === 'profils' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            💫 Profils & Match
          </button>
          <button
            onClick={() => setActiveTab('boutique')}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
              activeTab === 'boutique' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛍️ Boutique
          </button>
          <button
            onClick={() => setActiveTab('globe')}
            className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
              activeTab === 'globe' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🌐 Carte & Globe VIBE
          </button>
        </div>

        {activeTab === 'salon' && (
          <section className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 backdrop-blur">
            <div className="max-w-xl mx-auto text-center">
              <span className="text-xs uppercase font-bold tracking-widest text-pink-400 mb-2 block">Espace Détente & Musique</span>
              <h2 className="text-3xl font-bold mb-4">Le Salon VIBE</h2>
              <p className="text-slate-300 text-sm mb-8">Lancez la piste du salon avec gestion des erreurs navigateur et du volume.</p>

              <audio
                ref={audioRef}
                src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
                preload="metadata"
                onCanPlay={() => setAudioReady(true)}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                  setAudioError('Piste audio indisponible pour le moment.');
                  setIsPlaying(false);
                }}
              />

              <div className="bg-slate-900/80 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <span className="text-4xl">{isPlaying ? '📻' : '🎧'}</span>
                </div>

                <div className="w-full">
                  <button
                    onClick={toggleAudio}
                    disabled={!audioReady && !audioError}
                    className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg hover:opacity-95 transition disabled:opacity-60"
                  >
                    {isPlaying ? 'Mettre en pause' : 'Lancer la musique du salon'}
                  </button>
                  {!audioReady && !audioError && <p className="text-slate-400 text-xs mt-3">Chargement de la piste audio...</p>}
                  {audioError && <p className="text-amber-400 text-xs mt-3">{audioError}</p>}
                </div>

                <div className="w-full flex items-center gap-3">
                  <span className="text-xs text-slate-400">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(event) => setVolume(parseVolume(event.target.value))}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">🔊</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'acces' && (
          <section className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-3">
              <h2 className="text-2xl font-bold">Inscription & Billets</h2>
              <p className="text-slate-300 text-sm">
                Règle active: {appConfig.freeRegistrationsLimit} inscriptions gratuites, ensuite {appConfig.yearlyPaidTicketsLimit} billets annuels à {appConfig.yearlyPaidTicketPriceCad}$ CAD (paiement unique).
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/60">
                  <p>Inscriptions gratuites restantes: <strong>{freeRemaining}</strong></p>
                  <p className="text-xs text-slate-400">Utilisées: {appConfig.freeRegistrationsUsed}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/60">
                  <p>Billets 1 an restants: <strong>{paidRemaining}</strong></p>
                  <p className="text-xs text-slate-400">Vendus: {appConfig.yearlyPaidTicketsSold}</p>
                </div>
              </div>
              {freeRemaining > 0 ? (
                <p className="text-emerald-300 text-sm">Inscription gratuite disponible actuellement.</p>
              ) : paidRemaining > 0 ? (
                <p className="text-amber-300 text-sm">Le quota gratuit est atteint. Les billets annuels payants sont maintenant ouverts.</p>
              ) : (
                <p className="text-rose-300 text-sm">Quota payant atteint. Ouvrir une liste d’attente côté backend.</p>
              )}
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">Tarifs (semaine/mois/année/boost)</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRICE_PLANS.map((plan) => (
                  <article key={plan.id} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <p className="text-sm text-slate-300">{plan.label}</p>
                    <p className="text-2xl font-black mt-1">{plan.price}</p>
                    <p className="text-xs text-slate-400 mt-2">{plan.note}</p>
                  </article>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">Paiements et remboursements nécessitent un backend financier sécurisé (non inclus côté frontend seul).</p>
            </div>
          </section>
        )}

        {activeTab === 'profils' && (
          <section className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-2">Profils, chuchotement et match</h2>
              <p className="text-slate-300 text-sm">Le flash blanc et le message de match sont actuellement des simulations UI locales pour validation produit.</p>
            </div>

            {profileNotice && <div className="p-3 text-sm rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200">{profileNotice}</div>}
            {matchNotice && <div className="p-3 text-sm rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-200">{matchNotice}</div>}

            <div className="grid md:grid-cols-3 gap-4">
              {PROFILES.map((profile) => {
                const isRevealed = revealedProfiles[profile.id];
                const hideProfile = ghostMode && !isRevealed;

                return (
                  <article key={profile.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                    <div className="relative h-32 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 overflow-hidden flex items-center justify-center">
                      <span className="text-5xl">{hideProfile ? '🕶️' : '🙂'}</span>
                      {hideProfile && (
                        <div className="absolute inset-0 bg-slate-200/20 backdrop-blur-md flex items-center justify-center text-xs text-slate-100 font-semibold">
                          Silhouette masquée par brouillard
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold mt-3">{hideProfile ? 'Profil masqué' : profile.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{hideProfile ? 'Identité cachée en mode fantôme' : profile.mood}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleProfileClick(profile)}
                        className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold"
                      >
                        Cliquer profil
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRevealProfile(profile.id)}
                        className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
                      >
                        {isRevealed ? 'Re-cacher' : 'Se dévoiler'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'boutique' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Boutique Officielle</h2>
              <p className="text-slate-400 text-sm">Les liens externes sont sécurisés; les parcours internes non branchés affichent un repli explicite.</p>
            </div>

            {shopNotice && <div className="p-3 text-sm rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">{shopNotice}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SHOP_ITEMS.map((item) => (
                <div key={item.id} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/50 transition shadow-lg">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full">{item.badge}</span>
                      <span className="text-lg font-black text-white">{item.price}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-300 text-sm mb-3">{item.description}</p>
                    {!item.isExternal && <p className="text-[11px] text-slate-400">Route prévue: {item.routeLabel}</p>}
                  </div>

                  {item.isExternal ? (
                    toSafeExternalUrl(item.url) ? (
                      <a
                        href={toSafeExternalUrl(item.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2.5 rounded-xl font-semibold bg-slate-700 hover:bg-purple-600 text-white text-sm transition"
                      >
                        Visiter le lien externe ↗
                      </a>
                    ) : (
                      <button type="button" disabled className="w-full py-2.5 rounded-xl font-semibold bg-slate-700/40 text-slate-400 text-sm">
                        Lien externe non sécurisé
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShopNotice('Cette route interne n’est pas encore publiée. Aucun lien cassé n’a été ouvert.')}
                      className="w-full text-center py-2.5 rounded-xl font-semibold bg-slate-700 hover:bg-purple-600 text-white text-sm transition"
                    >
                      Bientôt disponible
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'globe' && (
          <section className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Carte d’Humeur Communautaire 3D</h2>
            <p className="text-slate-400 text-sm mb-6">Visualisation UI simulée. Le nombre de membres n’est pas connecté à un backend temps réel.</p>

            <div className="h-64 bg-slate-900 border border-slate-700 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse" />
              <span className="text-6xl mb-3">🌍</span>
              <p className="text-xs text-slate-400 font-mono">Simulateur Globe Three.js (UI de démonstration)</p>
              <p className="text-xs text-amber-300 mt-1">Aucune donnée de présence réelle branchée</p>
            </div>
          </section>
        )}

        <section className="mt-8 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 space-y-1">
          <p>Fondateur / finance: <strong>{appConfig.adminContactEmail}</strong></p>
          <p>Directeur des opérations: <strong>{appConfig.operationsDirectorName}</strong> ({appConfig.operationsDirectorEmail})</p>
          <p>Support: <strong>{appConfig.supportContactEmail}</strong></p>
          <p className="text-slate-400">Le directeur des opérations n’a pas accès aux paiements/remboursements sans backend RBAC dédié.</p>
          <p className="text-slate-400">Mode Ange temps réel: <strong>{appConfig.sosApiUrl ? 'configuré (confirmation backend requise)' : 'simulé (backend non configuré)'}</strong></p>
          <p className="text-slate-400">Traduction 10 langues: {TRANSLATION_LANGUAGES.join(' · ')}</p>
        </section>
      </main>

      {angeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">🛡️</span>
              <h3 className="text-xl font-bold text-rose-500">Mode Ange — Urgence</h3>
              <p className="text-xs text-slate-300 mt-1">Signal SOS avec confirmation backend obligatoire pour être marqué comme transmis.</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl mb-4 text-xs space-y-2 border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Statut Localisation:</span>
                <span className="font-bold text-slate-200">{isLocating ? 'Recherche GPS en cours...' : location ? 'Coordonnées prêtes' : 'Non disponible'}</span>
              </div>

              {location && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Position GPS:</span>
                  <span className="font-mono text-rose-400">{location.lat}, {location.lng}</span>
                </div>
              )}

              {geoError && <p className="text-amber-300">{geoError}</p>}

              <p className="text-slate-400 text-[11px] pt-1">Sécurité/confidentialité: partagez votre position uniquement avec consentement explicite.</p>
            </div>

            {!appConfig.sosApiUrl && (
              <div className="p-3 mb-4 text-xs rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                Mode simulé: aucun backend SOS configuré. Aucun envoi réel ne peut être garanti.
              </div>
            )}

            {(sosState === SOS_STATE.SIMULATED || sosState === SOS_STATE.CONFIRMED || sosState === SOS_STATE.FAILED || sosState === SOS_STATE.SENDING) && (
              <div
                className={`p-3 mb-4 text-sm rounded-xl border ${
                  sosState === SOS_STATE.CONFIRMED
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : sosState === SOS_STATE.SENDING
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-rose-500/20 border-rose-500 text-rose-300'
                }`}
              >
                {sosMessage}
              </div>
            )}

            <button
              onClick={handleSendSOS}
              disabled={isLocating || sosState === SOS_STATE.SENDING}
              className="w-full py-3.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 transition disabled:opacity-50"
            >
              {sosState === SOS_STATE.SENDING ? 'Envoi en cours...' : 'Envoyer le signal d’urgence'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
