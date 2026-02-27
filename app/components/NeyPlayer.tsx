"use client";
import { useState, useEffect, useRef } from 'react';

export default function NeyPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = 0.22;
        audio.loop = true;

        const onCanPlay = () => {
            setReady(true);
            audio.play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        };
        audio.addEventListener('canplaythrough', onCanPlay);
        return () => audio.removeEventListener('canplaythrough', onCanPlay);
    }, []);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().then(() => setIsPlaying(true)).catch(() => { });
        }
    };

    return (
        <>
            {/* Hidden audio element — user can replace /ney.mp3 in /public with their own file */}
            <audio
                ref={audioRef}
                preload="auto"
                loop
            >
                <source src="/ney.mp3" type="audio/mpeg" />
                {/* Fallback: Wikipedia ney recording */}
                <source
                    src="https://upload.wikimedia.org/wikipedia/commons/transcoded/5/57/Ney.ogg/Ney.ogg.mp3"
                    type="audio/mpeg"
                />
            </audio>

            {/* Small floating play/pause button at top-center */}
            <div
                style={{ position: 'fixed', top: '6px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999 }}
                title={isPlaying ? 'Müziği durdur' : 'Müziği çal'}
            >
                <button
                    onClick={toggle}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid rgba(180,140,60,0.35)',
                        background: 'rgba(255,255,255,0.75)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 1px 8px rgba(0,0,0,0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        padding: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isPlaying ? (
                        /* Pause icon — two vertical bars */
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="2" y="1.5" width="3" height="9" rx="1" fill="#B8860B" />
                            <rect x="7" y="1.5" width="3" height="9" rx="1" fill="#B8860B" />
                        </svg>
                    ) : (
                        /* Play icon — triangle */
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <polygon points="3,1.5 11,6 3,10.5" fill="#B8860B" />
                        </svg>
                    )}
                </button>
            </div>
        </>
    );
}
