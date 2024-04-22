function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#2980B9] via-[#6DD5FA] to-white">
      {children}
    </div>
  );
}

export default AuthLayout;
