interface AthleteHeroProps {
  name: string;
  sport: string;
  syncLabel: string;
  photoUrl?: string;
}

// Kartu hero dengan foto atlet sebagai latar. Ganti `photoUrl` dengan URL foto
// asli (mis. dari Supabase Storage) kapan pun siap -- selama belum ada,
// placeholder gradient + ikon di bawah ini tampil otomatis sebagai fallback.
export default function AthleteHero({ name, sport, syncLabel, photoUrl }: AthleteHeroProps) {
  return (
    <div className="relative h-52 w-full overflow-hidden rounded-3xl border border-hairline">
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(196,255,61,0.18),transparent_55%),linear-gradient(160deg,rgb(24,35,56),rgb(10,15,26))]">
          <img src="/logo.png" alt="" className="h-16 w-16 object-contain opacity-70" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-ink/60 px-2.5 py-1 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-optimal" />
        <span className="text-[11px] text-ivory/90">{syncLabel}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="inline-block rounded-full bg-volt px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
          {sport}
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-none text-ivory">{name}</h1>
      </div>
    </div>
  );
}