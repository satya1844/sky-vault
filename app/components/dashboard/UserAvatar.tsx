'use client';

interface UserAvatarProps {
  user?: {
    firstName?: string | null;
    imageUrl?: string;
  };
  variant?: "desktop" | "mobile";
}

export default function UserAvatar({ user, variant = "desktop" }: UserAvatarProps) {
  const getInitial = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    return "P";
  };

  const bgColor = variant === "mobile" ? "bg-blue-600" : "bg-[#1D1D1D]";

  return (
    <a
      href="/dashboard/profile"
      className={`${bgColor} rounded-full h-10 w-10 flex items-center justify-center text-white font-medium`}
    >
      {user?.imageUrl ? (
        <img
          src={user.imageUrl}
          alt="User Avatar"
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        getInitial()
      )}
    </a>
  );
}
