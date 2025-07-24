interface TopbarProps {
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
  };
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <>
    <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
      <div className="text-lg font-semibold">Welcome, {user?.firstName || "Guest"}!</div>
      {user?.imageUrl && (
        <img
          src={user.imageUrl}
          alt="User Avatar"
          className="w-8 h-8 rounded-full"
        />
      )}
    </div>
    
    </>
  );
}
