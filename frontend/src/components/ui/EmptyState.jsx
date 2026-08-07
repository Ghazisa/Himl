export function EmptyState({ icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      {Icon && <Icon aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-gray-400" />}
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  );
}
