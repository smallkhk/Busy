export type CardData = {
  name: string;
  day: number;
  money: string;
  home: string;
  packaging: number;
  longLeg: number;
  followers: number;
  goals: string;
  url: string;
};

/** Draws a 1080×1350 brag card for WhatsApp status / AbujaGram. */
export function drawCard(d: CardData): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, '#145c45');
  bg.addColorStop(1, '#0a1f18');
  g.fillStyle = bg;
  g.fillRect(0, 0, 1080, 1350);

  // Skyline silhouette
  g.fillStyle = 'rgba(232, 176, 75, 0.12)';
  [[60, 140], [180, 200], [300, 160], [420, 230], [560, 180], [700, 220], [840, 160], [960, 200]].forEach(([x, h]) => g.fillRect(x, 1350 - h, 100, h));

  g.textAlign = 'center';
  g.fillStyle = '#f6efe0';
  g.font = '900 96px system-ui, sans-serif';
  g.fillText('ABUJA', 430, 170);
  g.fillStyle = '#e8b04b';
  g.fillText('LIFE', 760, 170);

  g.fillStyle = '#f6efe0';
  g.font = '700 54px system-ui, sans-serif';
  g.fillText(`${d.name} don survive`, 540, 300);
  g.fillStyle = '#e8b04b';
  g.font = '900 120px system-ui, sans-serif';
  g.fillText(`${d.day} days 💪`, 540, 430);
  g.fillStyle = '#b9c9bf';
  g.font = '500 40px system-ui, sans-serif';
  g.fillText('for Abuja', 540, 490);

  const rows: [string, string][] = [
    ['💰 Money', d.money],
    ['🏠 House', d.home],
    ['👔 Packaging', String(d.packaging)],
    ['🦵 Long Leg', String(d.longLeg)],
    ['📸 Followers', d.followers.toLocaleString('en-NG')],
    ['🏆 Goals', d.goals],
  ];
  rows.forEach(([k, v], i) => {
    const y = 600 + i * 95;
    g.fillStyle = 'rgba(255, 255, 255, 0.07)';
    g.beginPath();
    g.roundRect(120, y - 62, 840, 80, 24);
    g.fill();
    g.textAlign = 'left';
    g.fillStyle = '#f6efe0';
    g.font = '600 40px system-ui, sans-serif';
    g.fillText(k, 160, y);
    g.textAlign = 'right';
    g.fillStyle = '#e8b04b';
    g.font = '800 40px system-ui, sans-serif';
    g.fillText(v, 920, y);
  });

  g.textAlign = 'center';
  g.fillStyle = '#f6efe0';
  g.font = '700 40px system-ui, sans-serif';
  g.fillText('Your own turn. Play free 👇', 540, 1230);
  g.fillStyle = '#e8b04b';
  g.font = '800 42px system-ui, sans-serif';
  g.fillText(d.url, 540, 1290);
  return c;
}

/** Share via the phone share sheet when possible, else download the picture. */
export async function shareCard(d: CardData, text: string): Promise<'shared' | 'downloaded'> {
  const canvas = drawCard(d);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Could not draw card');
  const file = new File([blob], 'abuja-life.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], text });
    return 'shared';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'abuja-life.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}
