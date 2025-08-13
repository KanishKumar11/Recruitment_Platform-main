// components/SubmitterInfo.tsx
import React from "react";
import { useGetUserByIdQuery } from "../store/services/usersApi";
import { Loader2 } from "lucide-react";

interface SubmitterInfoProps {
  submitterId: string;
  currentUserId?: string;
  fallbackName?: string;
}

const SubmitterInfo: React.FC<SubmitterInfoProps> = ({
  submitterId,
  currentUserId,
  fallbackName,
}) => {
  const { data: user, isLoading, isError } = useGetUserByIdQuery(submitterId);

  // Show "You" if it's the current user
  if (submitterId === currentUserId) {
    return (
      <div>
        <div className="font-medium text-gray-900">You</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div>
        <div className="font-medium text-gray-900">
          {fallbackName || "Unknown User"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-medium text-gray-900">{user.name || user.email}</div>
      {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
      {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
    </div>
  );
};

export default SubmitterInfo;
