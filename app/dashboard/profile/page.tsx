'use client';

import { Mail, User, LogOut, Shield, ArrowRight, Calendar, Settings, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import Badge from "@/components/ui/Badge";
import { useRouter } from "next/navigation";
import axios from "axios";

interface UserStats {
  fileCount: number;
  totalStorage: string;
  sharedCount: number;
}

export default function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  // State for real data
  const [userStats, setUserStats] = useState<UserStats>({
    fileCount: 0,
    totalStorage: '0 KB',
    sharedCount: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch user statistics from API
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;
      
      setIsLoadingStats(true);
      try {
        const response = await axios.get(`/api/user/stats?userId=${user.id}`, {
          withCredentials: true
        });
        setUserStats(response.data);
      } catch (error) {
        console.error("Error fetching user stats:", error);
        // Keep default values on error
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (isSignedIn && user?.id) {
      fetchUserStats();
    }
  }, [user?.id, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-white/80 text-center">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <CardHeader className="flex gap-3 pb-6">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <User className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Welcome</h2>
              <p className="text-white/60">Access your profile</p>
            </div>
          </CardHeader>
          <CardBody className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Not Signed In</h3>
            <p className="text-white/60 mb-6">
              Please sign in to access your profile and features
            </p>
            <Button
              variant="solid"
              color="primary"
              size="lg"
              onClick={() => router.push("/sign-in")}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              endContent={<ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const email = user.primaryEmailAddress?.emailAddress || "";
  const initials = fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const userRole = user.publicMetadata.role as string | undefined;
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  }) : null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Optional: Make API call to backend for additional cleanup
      // await axios.post('/api/auth/signout', { userId: user.id });
      
      signOut(() => {
        router.push("/");
      });
    } catch (error) {
      console.error("Error during sign out:", error);
      // Still proceed with Clerk signout even if API fails
      signOut(() => {
        router.push("/");
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleEditProfile = () => {
    router.push("/dashboard/profile/edit");
  };

  const handleAccountSettings = () => {
    router.push("/dashboard/settings");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#020108] relative overflow-hidden ">
      {/* Background decorative elements */}
      

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 rounded-2xl">
        {/* Main Profile Card */}
        <Card className="w-3/4 max-w-lg bg-[#1D1D1D] h-full rounded-2xl shadow-lg border border-white/10">
          {/* Header with background gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl">
            <div className="absolute top-4 right-4">
              <Button
                isIconOnly
                variant="flat"
                onClick={handleAccountSettings}
                className="bg-white/20 hover:bg-white/30 transition-colors duration-200"
                aria-label="Account Settings"
              >
                <Settings className="h-4 w-4 text-white" />
              </Button>
            </div>
            
            {/* Profile Avatar - overlapping design */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {user.imageUrl ? (
                  <Avatar
                    src={user.imageUrl}
                    alt={fullName}
                    className="w-24 h-24 border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <span className="text-white text-2xl font-bold">{initials}</span>
                  </div>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="solid"
                  onClick={handleEditProfile}
                  className="absolute -bottom-2 -right-2 bg-white text-gray-700 hover:bg-gray-100 shadow-lg"
                  aria-label="Edit profile"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-center mt-4">
                <h1 className="text-2xl font-bold text-white mb-1">{fullName || "User"}</h1>
                {userRole && (
                  <Badge
                    color="secondary"
                    variant="flat"
                    className="bg-white/20 text-white border-white/30"
                  >
                    {userRole}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <CardBody className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Mail className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white/60 text-xs uppercase tracking-wide">Email</p>
                  <p className="text-white font-medium">{email}</p>
                </div>
                <div className="flex items-center">
                  <Badge
                    color={
                      user.emailAddresses?.[0]?.verification?.status === "verified"
                        ? "success"
                        : "warning"
                    }
                    variant="flat"
                    className="text-xs"
                  >
                    {user.emailAddresses?.[0]?.verification?.status === "verified"
                      ? "Verified"
                      : "Pending"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Shield className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white/60 text-xs uppercase tracking-wide">Account Status</p>
                  <p className="text-white font-medium">Active</p>
                </div>
                <div className="flex items-center">
                  <Badge color="success" variant="flat" className="text-xs">
                    Active
                  </Badge>
                </div>
              </div>

              {joinDate && (
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-xs uppercase tracking-wide">Member Since</p>
                    <p className="text-white font-medium">{joinDate}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats - Real Data */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                {isLoadingStats ? (
                  <Spinner size="sm" color="primary" />
                ) : (
                  <div className="text-xl font-bold text-white">{userStats.fileCount}</div>
                )}
                <div className="text-white/60 text-xs">Files</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                {isLoadingStats ? (
                  <Spinner size="sm" color="primary" />
                ) : (
                  <div className="text-xl font-bold text-white">{userStats.totalStorage}</div>
                )}
                <div className="text-white/60 text-xs">Storage</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                {isLoadingStats ? (
                  <Spinner size="sm" color="primary" />
                ) : (
                  <div className="text-xl font-bold text-white">{userStats.sharedCount}</div>
                )}
                <div className="text-white/60 text-xs">Shared</div>
              </div>
            </div>
          </CardBody>

          <Divider className="border-white/10" />
          
          <CardFooter className="p-6">
            <Button
              variant="flat"
              color="danger"
              startContent={<LogOut className="h-4 w-4" />}
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 transition-all duration-200 disabled:opacity-50"
            >
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </CardFooter>
        </Card>

        {/* Additional Actions */}
        <div className="mt-6 flex space-x-4">
          <Button
            variant="flat"
            onClick={handleAccountSettings}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            startContent={<Settings className="h-4 w-4" />}
          >
            Account Settings
          </Button>
          <Button
            variant="flat"
            onClick={handleGoToDashboard}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            startContent={<ArrowRight className="h-4 w-4" />}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}