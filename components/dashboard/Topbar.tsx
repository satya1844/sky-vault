interface TopbarProps {
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
  };
}

export default function Topbar({ user }: TopbarProps) {
  const getInitial = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    return "P"; // fallback
  };

  return (
    <div className="mt-5 px-4 grid grid-cols-16 gap-4" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
      {/* Large input area - 12 cols */}
      <div className="col-span-12 border border-white/10 rounded-[35px] h-12"></div>
      
      {/* Medium button - 3 cols */}
      <div className="col-span-3 bg-[#1D1D1D] rounded-[35px] h-12"></div>
      
      {/* Small profile circle - 1 col */}
      <div className="col-span-1 bg-[#1D1D1D] rounded-full h-12 w-12 flex items-center justify-center text-white font-medium">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt="User Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          getInitial()
        )}
      </div>
    </div>
  );
}
