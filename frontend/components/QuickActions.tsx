interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

// Baris ikon aksi cepat ala fintech app (Withdraw/Deposit/dst) -- di sini
// diisi aksi yang relevan buat atlet: kalibrasi, riwayat, laporan, dst.
export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-hairline bg-surface py-3 transition-colors active:bg-surface-raised disabled:opacity-40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-volt/15 text-volt">
            {action.icon}
          </span>
          <span className="text-center text-[10px] font-medium leading-tight text-muted">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}