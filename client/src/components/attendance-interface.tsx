import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  Download, 
  FileText, 
  Eye,
  UserCheck,
  Timer,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Coffee,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Schema for attendance request
const attendanceRequestSchema = z.object({
  requestType: z.string().min(1, "نوع الطلب مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  timeFrom: z.string().optional(),
  timeTo: z.string().optional(),
  duration: z.number().min(0.5, "المدة مطلوبة"),
  durationType: z.string().min(1, "نوع المدة مطلوب"),
  reason: z.string().min(1, "السبب مطلوب"),
  notes: z.string().optional(),
});

type AttendanceRequestFormData = z.infer<typeof attendanceRequestSchema>;

interface AttendanceRequest {
  id: number;
  requestType: string;
  date: string;
  timeFrom?: string;
  timeTo?: string;
  duration: number;
  durationType: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  employeeName?: string;
}

interface AttendanceDay {
  date: string;
  hours: number;
  status: 'full' | 'partial' | 'absent' | 'leave';
  requests?: AttendanceRequest[];
}

interface AttendanceInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceInterface({ open, onOpenChange }: AttendanceInterfaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState("submit-request");

  const form = useForm<AttendanceRequestFormData>({
    resolver: zodResolver(attendanceRequestSchema),
    defaultValues: {
      requestType: "استئذان",
      date: format(new Date(), "yyyy-MM-dd"),
      timeFrom: "",
      timeTo: "",
      duration: 1,
      durationType: "أيام",
      reason: "",
      notes: "",
    },
  });

  const requestType = form.watch("requestType");
  const durationType = form.watch("durationType");

  // Get attendance requests for current user
  const { data: attendanceRequests = [] } = useQuery<AttendanceRequest[]>({
    queryKey: ['/api/attendance-requests'],
  });

  // Get monthly attendance data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const { data: monthlyAttendance = [] } = useQuery<AttendanceDay[]>({
    queryKey: ['/api/attendance/monthly', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
  });

  // Get pending leave requests for approval
  const { data: pendingLeaveRequests = [] } = useQuery({
    queryKey: ['/api/leave-requests'],
    select: (data: any[]) => data.filter((request: any) => request.status === 'pending'),
  });

  // Get daily attendance records for management
  const { data: dailyAttendance = [] } = useQuery({
    queryKey: ['/api/daily-attendance'],
    refetchInterval: 30000, // Refetch every 30 seconds instead of 2 seconds
  });

  // Get users list
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  // Submit attendance request mutation - sends to leave requests for approval workflow
  const createAttendanceRequestMutation = useMutation({
    mutationFn: async (data: AttendanceRequestFormData) => {
      // Convert attendance request to leave request format for approval workflow
      return await apiRequest("/api/leave-requests", "POST", {
        requestType: data.requestType,
        startDate: data.date,
        endDate: data.requestType === "إجازة" ? data.date : undefined,
        duration: data.duration,
        durationType: data.durationType,
        reason: data.reason,
        userName: "اسم الموظف", // Replace with actual user name
        userId: 1, // Replace with actual user ID
        requestedBy: 1, // Replace with actual user ID
        requestedByName: "اسم الموظف", // Replace with actual user name
        status: "pending"
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "سيتم عرض طلبك في طلبات الإجازة المعلقة للمراجعة والموافقة",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance-requests'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error submitting attendance request:", error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  // Approve/Reject leave request mutation
  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      const response = await fetch(`/api/leave-requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status, 
          rejectionReason,
          approvedBy: 1, // Replace with actual user ID
          approvedByName: "المدير" // Replace with actual user name
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "approved" ? "تم الموافقة على الطلب" : "تم رفض الطلب",
        description: variables.status === "approved" ? "تم الموافقة على طلب الإجازة/الاستئذان" : "تم رفض الطلب",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-attendance"] });
    },
    onError: () => {
      toast({
        title: "خطأ في تحديث الطلب",
        description: "حدث خطأ أثناء تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AttendanceRequestFormData) => {
    createAttendanceRequestMutation.mutate(data);
  };

  // Calculate end time based on duration
  const calculateEndTime = (startTime: string, duration: number, durationType: string) => {
    if (!startTime || durationType !== "ساعات") return "";
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (duration * 60);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Update end time when start time or duration changes
  useEffect(() => {
    if (requestType === "استئذان" && durationType === "ساعات") {
      const timeFrom = form.getValues("timeFrom");
      const duration = form.getValues("duration");
      if (timeFrom && duration) {
        const endTime = calculateEndTime(timeFrom, duration, durationType);
        form.setValue("timeTo", endTime);
      }
    }
  }, [form.watch("timeFrom"), form.watch("duration"), requestType, durationType]);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.map(day => {
      const dayData = monthlyAttendance.find((att) => 
        isSameDay(parseISO(att.date), day)
      );
      
      return {
        date: day,
        hours: dayData?.hours || 0,
        status: dayData?.status || 'absent',
        requests: dayData?.requests || []
      };
    });
  };

  const calendarDays = generateCalendarDays();

  // Get color for attendance bar based on hours
  const getAttendanceColor = (hours: number, status: string) => {
    if (status === 'leave') return 'bg-blue-500';
    if (status === 'absent') return 'bg-red-500';
    if (hours >= 8) return 'bg-green-500';
    if (hours >= 6) return 'bg-yellow-500';
    if (hours >= 4) return 'bg-orange-500';
    return 'bg-red-400';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'موافق';
      case 'rejected': return 'مرفوض';
      default: return 'قيد المراجعة';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-container max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-white">
            واجهة الدوام والحضور
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 glass-card">
            <TabsTrigger value="submit-request" className="text-white text-xs">
              <Plus className="w-3 h-3 ml-1" />
              إرسال طلب
            </TabsTrigger>
            <TabsTrigger value="request-status" className="text-white text-xs">
              <FileText className="w-3 h-3 ml-1" />
              حالة الطلبات
            </TabsTrigger>
            <TabsTrigger value="monthly-attendance" className="text-white text-xs">
              <Calendar className="w-3 h-3 ml-1" />
              دوام الشهر
            </TabsTrigger>
            <TabsTrigger value="pending-requests" className="text-white text-xs">
              <AlertCircle className="w-3 h-3 ml-1" />
              الطلبات المعلقة
            </TabsTrigger>
            <TabsTrigger value="daily-attendance" className="text-white text-xs">
              <Users className="w-3 h-3 ml-1" />
              الدوام اليومي
            </TabsTrigger>
          </TabsList>

          {/* Submit Request Tab */}
          <TabsContent value="submit-request" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">إرسال طلب دوام</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="requestType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">نوع الطلب</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="glass-card text-white border-white/20">
                                  <SelectValue placeholder="اختر نوع الطلب" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="استئذان">استئذان</SelectItem>
                                <SelectItem value="تأخير">تأخير في الحضور</SelectItem>
                                <SelectItem value="انصراف مبكر">انصراف مبكر</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">التاريخ</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="glass-card text-white border-white/20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {(requestType === "استئذان" || requestType === "تأخير" || requestType === "انصراف مبكر") && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="timeFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">
                                {requestType === "تأخير" ? "وقت الحضور المتوقع" : 
                                 requestType === "انصراف مبكر" ? "وقت الانصراف" : "من الساعة"}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="glass-card text-white border-white/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {requestType === "استئذان" && (
                          <FormField
                            control={form.control}
                            name="timeTo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">إلى الساعة</FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    className="glass-card text-white border-white/20"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="durationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">نوع المدة</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="glass-card text-white border-white/20">
                                    <SelectValue placeholder="اختر نوع المدة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ساعات">ساعات</SelectItem>
                                  <SelectItem value="أيام">أيام</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            المدة ({durationType === "ساعات" ? "بالساعات" : "بالأيام"})
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={durationType === "ساعات" ? "0.5" : "1"}
                              step={durationType === "ساعات" ? "0.5" : "1"}
                              className="glass-card text-white border-white/20"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">السبب</FormLabel>
                          <FormControl>
                            <Textarea
                              className="glass-card text-white border-white/20"
                              placeholder="اكتب سبب الطلب..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">ملاحظات إضافية (اختياري)</FormLabel>
                          <FormControl>
                            <Textarea
                              className="glass-card text-white border-white/20"
                              placeholder="أي ملاحظات إضافية..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full glass-card bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={createAttendanceRequestMutation.isPending}
                    >
                      {createAttendanceRequestMutation.isPending ? (
                        "جاري الإرسال..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 ml-2" />
                          إرسال الطلب
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request Status Tab */}
          <TabsContent value="request-status" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">حالة طلباتي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceRequests.length === 0 ? (
                    <div className="text-center text-white/70 py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد طلبات حتى الآن</p>
                    </div>
                  ) : (
                    attendanceRequests.map((request) => (
                      <div key={request.id} className="glass-card p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusBadgeColor(request.status)} text-white`}>
                              {getStatusText(request.status)}
                            </Badge>
                            <span className="text-white font-medium">{request.requestType}</span>
                          </div>
                          <span className="text-white/70 text-sm">
                            {format(parseISO(request.createdAt), "dd/MM/yyyy")}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-white/70">التاريخ:</span>
                            <p className="text-white font-medium">
                              {format(parseISO(request.date), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div>
                            <span className="text-white/70">المدة:</span>
                            <p className="text-white font-medium">
                              {request.duration} {request.durationType}
                            </p>
                          </div>
                          {request.timeFrom && (
                            <div>
                              <span className="text-white/70">الوقت:</span>
                              <p className="text-white font-medium">
                                {request.timeFrom} {request.timeTo && `- ${request.timeTo}`}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <span className="text-white/70 text-sm">السبب:</span>
                          <p className="text-white">{request.reason}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Attendance Tab */}
          <TabsContent value="monthly-attendance" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">دوام شهر {format(currentDate, "MMMM yyyy", { locale: ar })}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                    <div key={day} className="text-center text-white/70 text-sm font-medium p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => (
                    <div key={index} className="glass-card p-2 rounded-lg">
                      <div className="text-center text-white text-sm mb-2">
                        {format(day.date, "d")}
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`h-2 rounded-full ${getAttendanceColor(day.hours, day.status)}`} />
                        <div className="text-xs text-white/70 text-center">
                          {day.status === 'leave' ? 'إجازة' : 
                           day.status === 'absent' ? 'غياب' : 
                           `${day.hours}س`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full" />
                    <span className="text-white text-sm">8+ ساعات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                    <span className="text-white text-sm">6-8 ساعات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full" />
                    <span className="text-white text-sm">4-6 ساعات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                    <span className="text-white text-sm">أقل من 4 ساعات</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Pending Requests Tab */}
          <TabsContent value="pending-requests" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">الطلبات المعلقة للمراجعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingLeaveRequests.length === 0 ? (
                    <div className="text-center text-white/70 py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد طلبات معلقة</p>
                    </div>
                  ) : (
                    pendingLeaveRequests.map((request: any) => (
                      <div key={request.id} className="glass-card p-4 rounded-lg border border-yellow-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500 text-white">
                              قيد المراجعة
                            </Badge>
                            <span className="text-white font-medium">{request.requestType}</span>
                          </div>
                          <span className="text-white/70 text-sm">
                            {request.requestedByName || 'غير محدد'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-white/70">التاريخ:</span>
                            <p className="text-white font-medium">
                              {format(parseISO(request.startDate), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div>
                            <span className="text-white/70">المدة:</span>
                            <p className="text-white font-medium">
                              {request.duration} {request.durationType}
                            </p>
                          </div>
                          <div>
                            <span className="text-white/70">السبب:</span>
                            <p className="text-white font-medium">
                              {request.reason}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: "approved" })}
                            disabled={updateRequestStatusMutation.isPending}
                          >
                            <Check className="w-4 h-4 ml-1" />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: "rejected", rejectionReason: "تم الرفض من قبل المدير" })}
                            disabled={updateRequestStatusMutation.isPending}
                          >
                            <X className="w-4 h-4 ml-1" />
                            رفض
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Attendance Tab */}
          <TabsContent value="daily-attendance" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">الدوام اليومي للموظفين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <div className="text-center text-white/70 py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد بيانات موظفين</p>
                    </div>
                  ) : (
                    users.map((user: any) => {
                      const todayAttendance = dailyAttendance.find((att: any) => 
                        att.employeeId === user.id && 
                        att.date === format(new Date(), 'yyyy-MM-dd')
                      );
                      
                      return (
                        <div key={user.id} className="glass-card p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{user.name}</h3>
                                <p className="text-white/70 text-sm">{user.jobTitle}</p>
                              </div>
                            </div>
                            
                            <div className="text-left">
                              {todayAttendance ? (
                                <div>
                                  <Badge className="bg-green-500 text-white mb-1">
                                    حاضر
                                  </Badge>
                                  <div className="text-white/70 text-sm">
                                    {todayAttendance.checkInTime && `دخول: ${todayAttendance.checkInTime}`}
                                  </div>
                                  {todayAttendance.checkOutTime && (
                                    <div className="text-white/70 text-sm">
                                      خروج: {todayAttendance.checkOutTime}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge className="bg-red-500 text-white">
                                  غائب
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-white/70">إجمالي الساعات:</span>
                              <p className="text-white font-medium">
                                {todayAttendance?.totalHours || 0} ساعة
                              </p>
                            </div>
                            <div>
                              <span className="text-white/70">نوع الدوام:</span>
                              <p className="text-white font-medium">
                                {todayAttendance?.scheduleType || 'غير محدد'}
                              </p>
                            </div>
                            <div>
                              <span className="text-white/70">الحالة:</span>
                              <p className="text-white font-medium">
                                {todayAttendance?.status || 'غير محدد'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}