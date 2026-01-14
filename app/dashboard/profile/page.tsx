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
      <div className="min-h-screen  flex flex-col justify-center items-center p-4">
        <div className="backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-white/80 text-center text-sm md:text-base">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br\ flex flex-col justify-center items-center p-4">
        <Card className="max-w-sm md:max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <CardHeader className="flex gap-3 pb-4 md:pb-6">
            <div className="p-2 md:p-3 bg-blue-500/20 rounded-full">
              <User className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Welcome</h2>
              <p className="text-white/60 text-sm md:text-base">Access your profile</p>
            </div>
          </CardHeader>
          <CardBody className="text-center py-6 md:py-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <User className="h-8 w-8 md:h-10 md:w-10 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-2">Not Signed In</h3>
            <p className="text-white/60 mb-4 md:mb-6 text-sm md:text-base">
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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleEditProfile = () => {
    // Implement profile editing functionality
    console.log("Edit profile clicked");
  };

  const handleAccountSettings = () => {
    // Implement account settings functionality
    console.log("Account settings clicked");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen  p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Profile</h1>
                <p className="text-white/60 text-sm md:text-base">Manage your account</p>
              </div>
            </div>
            <Button
              variant="flat"
              color="danger"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              startContent={isSigningOut ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
              className="text-xs md:text-sm"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <Avatar
                  src={user?.imageUrl}
                  name={user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
                  className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4"
                />
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-1">
                    {user?.fullName || "User"}
                  </h2>
                  <p className="text-white/60 text-sm md:text-base">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                  <Badge 
                    color="success" 
                    variant="flat" 
                    className="mt-2"
                  >
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-3">
                  <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    startContent={<Edit className="h-4 w-4" />}
                    onClick={handleEditProfile}
                    className="w-full"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="flat"
                    color="default"
                    size="sm"
                    startContent={<Settings className="h-4 w-4" />}
                    onClick={handleAccountSettings}
                    className="w-full"
                  >
                    Account Settings
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Stats and Info Cards */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardBody className="p-4 md:p-6 text-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {isLoadingStats ? "..." : userStats.fileCount}
                  </h3>
                  <p className="text-white/60 text-xs md:text-sm">Files</p>
                </CardBody>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardBody className="p-4 md:p-6 text-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {isLoadingStats ? "..." : userStats.totalStorage}
                  </h3>
                  <p className="text-white/60 text-xs md:text-sm">Storage Used</p>
                </CardBody>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardBody className="p-4 md:p-6 text-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {isLoadingStats ? "..." : userStats.sharedCount}
                  </h3>
                  <p className="text-white/60 text-xs md:text-sm">Shared</p>
                </CardBody>
              </Card>
            </div>

            {/* Account Info */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <h3 className="text-lg md:text-xl font-bold text-white">Account Information</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Mail className="h-4 w-4 md:h-5 md:w-5 text-white/60" />
                      <span className="text-white/80 text-sm md:text-base">Email</span>
                    </div>
                    <span className="text-white text-sm md:text-base">
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </span>
                  </div>
                  
                  <Divider className="bg-white/20" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-white/60" />
                      <span className="text-white/80 text-sm md:text-base">Member Since</span>
                    </div>
                    <span className="text-white text-sm md:text-base">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  
                  <Divider className="bg-white/20" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Shield className="h-4 w-4 md:h-5 md:w-5 text-white/60" />
                      <span className="text-white/80 text-sm md:text-base">Status</span>
                    </div>
                    <Badge color="success" variant="flat" size="sm">
                      Verified
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <h3 className="text-lg md:text-xl font-bold text-white">Quick Actions</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    onClick={handleGoToDashboard}
                    startContent={<ArrowRight className="h-4 w-4" />}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="flat"
                    color="default"
                    size="sm"
                    onClick={handleAccountSettings}
                    startContent={<Settings className="h-4 w-4" />}
                    className="w-full"
                  >
                    Settings
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}