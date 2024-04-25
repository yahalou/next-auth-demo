import { Navbar } from "./_components/navbar";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full w-full flex flex-col gap-y-10 items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#2980B9] via-[#6DD5FA] to-white">
      <Navbar />
      {children}
    </div>
  );
};

export default ProtectedLayout;
