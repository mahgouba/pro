import { useQuery } from "@tanstack/react-query";
import { Clock, User, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LeaveRequest } from "@shared/schema";

export function PendingLeaveRequests() {
  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  // Filter only pending requests
  const pendingRequests = leaveRequests.filter(
    (request) => request.status === "قيد الموافقة" || request.status === "pending"
  );

  if (isLoading) {
    return (
      <Card className="glass-container border-yellow-200/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock size={20} />
            طلبات الإجازة قيد الموافقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-600/30 rounded"></div>
            <div className="h-4 bg-slate-600/30 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="glass-container border-yellow-200/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock size={20} />
          طلبات الإجازة قيد الموافقة
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30">
            {pendingRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.slice(0, 3).map((request) => (
          <div
            key={request.id}
            className="glass-container p-3 border-l-4 border-yellow-500"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <User size={16} />
                  <span className="font-medium">{request.userName}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30"
                >
                  {request.requestType}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(request.startDate).toLocaleDateString('ar-SA')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {request.duration} {request.durationType}
                </div>
              </div>

              {request.reason && (
                <div className="text-sm text-slate-400">
                  <div className="flex items-start gap-1">
                    <FileText size={14} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{request.reason}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {pendingRequests.length > 3 && (
          <div className="text-center pt-2">
            <span className="text-sm text-slate-400">
              و {pendingRequests.length - 3} طلب آخر...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}