export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-amethyst text-white hover:bg-violet",
    outline: "border border-amethyst text-amethyst hover:bg-lavender",
    ghost: "text-ink hover:bg-lavender",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
