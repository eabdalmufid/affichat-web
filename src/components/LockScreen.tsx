import React, { useState, useEffect, useRef } from 'react';
import { Lock, Delete, AlertCircle, ShieldAlert } from 'lucide-react';
import { verifyPin } from '../utils/security';
import logoImg from '../assets/logo-nobg.png';

interface LockScreenProps {
  pinHash: string;
  onUnlock: () => void;
  onResetApp: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ pinHash, onUnlock, onResetApp }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleDigitPress = (digit: string) => {
    if (cooldownSeconds > 0) return;
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    if (cooldownSeconds > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldownSeconds > 0 || !pin) return;

    const isValid = await verifyPin(pin, pinHash);
    if (isValid) {
      setPin('');
      setErrorMsg(null);
      setFailedAttempts(0);
      onUnlock();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');

      if (newAttempts >= 5) {
        setCooldownSeconds(30);
        setErrorMsg('Terlalu banyak percobaan salah. Silakan tunggu 30 detik.');
      } else {
        setErrorMsg(`PIN salah (${5 - newAttempts} kesempatan tersisa).`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0B0F12',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      className="chat-doodle-bg"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#12181D',
          border: '1px solid #222D35',
          borderRadius: '16px',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          transform: isShaking ? 'translateX(-6px)' : 'none',
          transition: isShaking ? 'transform 0.1s ease' : 'none',
        }}
      >
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <img src={logoImg} alt="AffiChat" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-6px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#00A884',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            <Lock size={13} />
          </div>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#E6ECEF', margin: '0 0 6px 0', textAlign: 'center' }}>
          AffiChat Terkunci
        </h2>
        <p style={{ fontSize: '13px', color: '#80929D', margin: '0 0 20px 0', textAlign: 'center', lineHeight: '1.4' }}>
          Masukkan PIN keamanan untuk membuka akses chat Anda.
        </p>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          value={pin}
          onChange={(e) => {
            if (cooldownSeconds > 0) return;
            const val = e.target.value.replace(/\D/g, '');
            setPin(val);
            setErrorMsg(null);
          }}
          onKeyDown={handleKeyDown}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          autoFocus
        />

        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#182026',
            border: '1px solid #222D35',
            minHeight: '44px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {Array.from({ length: Math.max(4, pin.length) }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: idx < pin.length ? '#00A884' : '#2D3C46',
                border: idx < pin.length ? '1px solid #00A884' : '1px solid #222D35',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#F15C6D',
              fontSize: '12px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {cooldownSeconds > 0 && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(245, 166, 35, 0.12)',
              border: '1px solid rgba(245, 166, 35, 0.3)',
              borderRadius: '8px',
              color: '#F5A623',
              fontSize: '12px',
              marginBottom: '16px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldAlert size={15} />
            <span>Coba lagi dalam {cooldownSeconds} detik</span>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            width: '100%',
            marginBottom: '18px',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={cooldownSeconds > 0}
              onClick={() => handleDigitPress(digit)}
              style={{
                height: '52px',
                borderRadius: '10px',
                backgroundColor: '#182026',
                border: '1px solid #222D35',
                color: '#E6ECEF',
                fontSize: '20px',
                fontWeight: 600,
                cursor: cooldownSeconds > 0 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.1s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.backgroundColor = '#222D35')}
              onMouseUp={(e) => (e.currentTarget.style.backgroundColor = '#182026')}
            >
              {digit}
            </button>
          ))}

          <div />

          <button
            type="button"
            disabled={cooldownSeconds > 0}
            onClick={() => handleDigitPress('0')}
            style={{
              height: '52px',
              borderRadius: '10px',
              backgroundColor: '#182026',
              border: '1px solid #222D35',
              color: '#E6ECEF',
              fontSize: '20px',
              fontWeight: 600,
              cursor: cooldownSeconds > 0 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.1s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.backgroundColor = '#222D35')}
            onMouseUp={(e) => (e.currentTarget.style.backgroundColor = '#182026')}
          >
            0
          </button>

          <button
            type="button"
            disabled={cooldownSeconds > 0 || pin.length === 0}
            onClick={handleBackspace}
            aria-label="Hapus digit"
            style={{
              height: '52px',
              borderRadius: '10px',
              backgroundColor: '#182026',
              border: '1px solid #222D35',
              color: pin.length > 0 ? '#E6ECEF' : '#53636E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: pin.length > 0 && cooldownSeconds === 0 ? 'pointer' : 'default',
              transition: 'background-color 0.1s ease',
            }}
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={cooldownSeconds > 0 || pin.length === 0}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: pin.length > 0 && cooldownSeconds === 0 ? '#00A884' : '#222D35',
            color: pin.length > 0 && cooldownSeconds === 0 ? '#FFFFFF' : '#80929D',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: pin.length > 0 && cooldownSeconds === 0 ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
            marginBottom: '16px',
          }}
        >
          Buka Kunci
        </button>

        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Lupa PIN keamanan?\n\nUntuk mereset PIN, semua data lokal di browser ini akan dibersihkan demi keamanan. WhatsApp Anda tetap aman di server gateway.\n\nLanjutkan reset?'
              )
            ) {
              onResetApp();
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#80929D',
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: '4px',
          }}
        >
          Lupa PIN keamanan?
        </button>
      </div>
    </div>
  );
};
