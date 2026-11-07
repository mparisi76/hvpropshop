import Logo from "@/components/Logo";

export default function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="mb-8">
        <Logo variant="dark" />
      </div>
      <div className="card w-full max-w-sm p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-neutral-600">{footer}</div>}
    </div>
  );
}
