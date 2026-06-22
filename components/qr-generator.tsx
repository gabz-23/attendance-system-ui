'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Maximize2, QrCode, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import QRCode from 'qrcode';

function useCountdown(durationSeconds: number) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [generation, setGeneration] = useState(0);

    useEffect(() => {
        setTimeLeft(durationSeconds);
    }, [durationSeconds]);

    useEffect(() => {
        if (durationSeconds === 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setGeneration((g) => g + 1);
                    return durationSeconds;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [durationSeconds]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const remaining =
        durationSeconds === 0 ? '∞' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const progress = durationSeconds > 0 ? (timeLeft / durationSeconds) * 100 : 100;

    return { timeLeft, remaining, progress, generation };
}

function useQrDataUrl(generation: number, classroomId?: string) {
    const [qrSrc, setQrSrc] = useState('/qr-code.png');

    useEffect(() => {
        const token = crypto.randomUUID();
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${baseUrl}/estudiante/escanear?session=${token}&classroom=${classroomId ?? 'unknown'}&t=${Date.now()}`;
        QRCode.toDataURL(url, { width: 480, margin: 1 }).then(setQrSrc);
    }, [generation, classroomId]);

    return qrSrc;
}

function QrExpirationSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const options = [
        { value: 600, label: '10 min' },
        { value: 900, label: '15 min' },
        { value: 0, label: 'Sin expiración' },
    ];

    return (
        <div className="flex w-full max-w-xs rounded-lg border border-border bg-muted p-0.5">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        value === opt.value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-foreground/60 hover:text-foreground'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function downloadQrImage(qrSrc: string, filename: string) {
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function QrActiveState({ classroomId }: { classroomId: string }) {
    const [durationSeconds, setDurationSeconds] = useState(600);
    const { remaining, progress, generation } = useCountdown(durationSeconds);
    const qrSrc = useQrDataUrl(generation, classroomId);

    return (
        <div className="flex flex-col items-center gap-4">
            <Badge className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/10">
                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                Activo
            </Badge>

            <QrExpirationSelector value={durationSeconds} onChange={setDurationSeconds} />

            <div
                key={generation}
                className="animate-[pop-in_0.3s_ease-out] rounded-xl border border-border bg-card p-3"
            >
                <Image
                    src={qrSrc}
                    alt="Código QR de asistencia"
                    width={240}
                    height={240}
                    className="size-60 rounded-md"
                />
            </div>

            {durationSeconds > 0 && (
                <div className="w-full max-w-xs text-center">
                    <p className="text-sm text-muted-foreground">Expira en</p>
                    <p className="font-mono text-4xl font-bold tracking-tight text-foreground">{remaining}</p>
                    <Progress value={progress} className="mt-3" />
                </div>
            )}

            <div className="flex w-full max-w-xs flex-col gap-2">
                <Button onClick={() => downloadQrImage(qrSrc, `qr-${classroomId}.png`)} variant="outline">
                    <Download className="size-4" />
                    Descargar QR
                </Button>
                <Button asChild variant="outline">
                    <Link href={`/profesor/aulas/${classroomId}/qr`}>
                        <Maximize2 className="size-4" />
                        Ver en pantalla completa
                    </Link>
                </Button>
            </div>
        </div>
    );
}

export function QrCountdown({ classroomId }: { classroomId: string }) {
    const [durationSeconds, setDurationSeconds] = useState(600);
    const { remaining, progress, generation } = useCountdown(durationSeconds);
    const qrSrc = useQrDataUrl(generation, classroomId);

    return (
        <>
            <div key={generation} className="animate-[pop-in_0.3s_ease-out] rounded-2xl bg-white p-6 shadow-2xl">
                <Image
                    src={qrSrc}
                    alt="Código QR de asistencia"
                    width={400}
                    height={400}
                    className="size-[min(80vw,400px)]"
                />
            </div>
            <div className="flex w-full max-w-xs rounded-lg border border-white/20 bg-white/10 p-0.5">
                {[
                    { value: 600, label: '10 min' },
                    { value: 900, label: '15 min' },
                    { value: 0, label: 'Sin expiración' },
                ].map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDurationSeconds(opt.value)}
                        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            durationSeconds === opt.value
                                ? 'bg-white text-foreground shadow-sm'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            {durationSeconds > 0 && (
                <div className="w-full max-w-md">
                    <p className="font-mono text-6xl font-bold tracking-tight text-white">{remaining}</p>
                    <Progress value={progress} className="mt-4 bg-white/15" />
                </div>
            )}
            <Button onClick={() => downloadQrImage(qrSrc, `qr-${classroomId}.png`)} variant="secondary">
                <Download className="size-4" />
                Descargar QR
            </Button>
        </>
    );
}

export function QrEmptyState({ onGenerate }: { onGenerate: () => void }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex aspect-square w-full max-w-[300px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/40 p-6 text-center">
                <QrCode className="size-16 text-muted-foreground/50" aria-hidden="true" />
                <p className="text-pretty text-sm text-muted-foreground">
                    Genera un código QR para que tus estudiantes marquen asistencia
                </p>
            </div>
            <Button onClick={onGenerate} className="w-full max-w-xs">
                <QrCode className="size-4" />
                Generar QR de asistencia
            </Button>
        </div>
    );
}
