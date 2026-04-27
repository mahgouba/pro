import { useEffect } from "react";
import { useLocation } from "wouter";

interface LeaveRequestPageProps {
  userRole: string;
  username: string;
  userId: number;
}

export default function LeaveRequestPage({ userRole, username, userId }: LeaveRequestPageProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the new attendance management page
    setLocation("/attendance-management");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">جاري التحويل...</h1>
        <p className="text-gray-300">يتم تحويلك إلى صفحة إدارة الحضور والإنصراف</p>
      </div>
    </div>
  );
}