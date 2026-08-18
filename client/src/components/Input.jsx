export default function Input({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      <input
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white
                   focus:border-amethyst focus:ring-1 focus:ring-amethyst outline-none
                   text-sm placeholder:text-gray-400"
        {...props}
      />
    </label>
  );
}
