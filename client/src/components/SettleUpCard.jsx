// The signature visual of the app: instead of a plain table of "who owes who",
// each settle-up transaction renders as two connected pill cards with an arrow
// showing money flowing from payer -> receiver. This is the feature we want to
// stand out visually since it's also the standout technical feature (the algorithm).

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-plum text-white flex items-center justify-center font-display font-semibold text-sm shrink-0">
      {initials(name)}
    </div>
  );
}

export default function SettleUpCard({ transaction }) {
  const { fromName, toName, amount } = transaction;

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 flex-1">
        <Avatar name={fromName} />
        <span className="font-medium text-sm text-ink">{fromName}</span>
      </div>

      <div className="flex flex-col items-center px-2 shrink-0">
        <span className="text-xs text-gray-400 mb-0.5">pays</span>
        <div className="flex items-center gap-1">
          <div className="h-px w-6 bg-amethyst" />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amethyst">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-display font-bold text-amethyst text-sm mt-0.5">₹{amount}</span>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="font-medium text-sm text-ink">{toName}</span>
        <Avatar name={toName} />
      </div>
    </div>
  );
}
