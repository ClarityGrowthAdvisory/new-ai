export interface ReviewTheme {
  id: string;
  label: string;
  description: string;
  emoji: string;
  // Page styles
  bgClass: string;
  cardClass: string;
  accentClass: string;
  accentBg: string;
  starActiveClass: string;
  buttonClass: string;
  headingFont: string;
  bodyFont: string;
  // Google Fonts import URL
  fontImport: string;
}

export const reviewThemes: Record<string, ReviewTheme> = {
  default: {
    id: "default",
    label: "General",
    description: "Clean, modern look for any business",
    emoji: "🏢",
    bgClass: "bg-[hsl(220,14%,96%)]",
    cardClass: "bg-white shadow-lg border-0",
    accentClass: "text-[hsl(250,60%,55%)]",
    accentBg: "bg-[hsl(250,60%,55%)]",
    starActiveClass: "text-amber-400 fill-amber-400",
    buttonClass: "bg-[hsl(250,60%,55%)] hover:bg-[hsl(250,60%,45%)] text-white",
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Space Grotesk', sans-serif",
    fontImport: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  },
  jewellery: {
    id: "jewellery",
    label: "Jewellery",
    description: "Elegant, luxurious gold & dark tones",
    emoji: "💎",
    bgClass: "bg-gradient-to-br from-[#1a1a2e] to-[#16213e]",
    cardClass: "bg-[#1a1a2e]/80 backdrop-blur-xl border border-[#c9a94e]/20 shadow-2xl shadow-[#c9a94e]/10",
    accentClass: "text-[#c9a94e]",
    accentBg: "bg-[#c9a94e]",
    starActiveClass: "text-[#c9a94e] fill-[#c9a94e]",
    buttonClass: "bg-gradient-to-r from-[#c9a94e] to-[#b8962d] hover:from-[#d4b85e] hover:to-[#c9a94e] text-[#1a1a2e] font-semibold",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Cormorant Garamond', serif",
    fontImport: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap",
  },
  salon: {
    id: "salon",
    label: "Salon / Spa",
    description: "Soft pastels, calming & relaxing vibe",
    emoji: "✂️",
    bgClass: "bg-gradient-to-br from-[#fce4ec] via-[#f3e5f5] to-[#e8eaf6]",
    cardClass: "bg-white/70 backdrop-blur-lg border border-pink-100 shadow-xl shadow-pink-100/30",
    accentClass: "text-[#ad1457]",
    accentBg: "bg-[#ad1457]",
    starActiveClass: "text-pink-400 fill-pink-400",
    buttonClass: "bg-gradient-to-r from-[#ad1457] to-[#d81b60] hover:from-[#c2185b] hover:to-[#e91e63] text-white",
    headingFont: "'Tenor Sans', sans-serif",
    bodyFont: "'Nunito', sans-serif",
    fontImport: "https://fonts.googleapis.com/css2?family=Tenor+Sans&family=Nunito:wght@400;500;600;700&display=swap",
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant / Café",
    description: "Warm, inviting and appetising tones",
    emoji: "🍽️",
    bgClass: "bg-gradient-to-br from-[#fef9ef] via-[#fff8e7] to-[#fef3e2]",
    cardClass: "bg-white/80 backdrop-blur-lg border border-orange-100 shadow-xl shadow-orange-100/30",
    accentClass: "text-[#bf360c]",
    accentBg: "bg-[#bf360c]",
    starActiveClass: "text-orange-400 fill-orange-400",
    buttonClass: "bg-gradient-to-r from-[#bf360c] to-[#e65100] hover:from-[#d84315] hover:to-[#ef6c00] text-white",
    headingFont: "'Merriweather', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    fontImport: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;500;600&display=swap",
  },
};

export const getTheme = (id: string): ReviewTheme => {
  return reviewThemes[id] || reviewThemes.default;
};
