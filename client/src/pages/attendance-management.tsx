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
  Clock as UserClock,
  Settings,
  Timer,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Coffee,
  CheckSquare,
  Printer,
  Search,
  Filter,
  Edit,
  Trash2,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, parseISO, isBefore } from "date-fns";
import { ar } from "date-fns/locale";

// Glass Background Components
const GlassBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
        <div className="blob blob-5"></div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const GlassContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`glass-container backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl ${className}`}>
      {children}
    </div>
  );
};

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg shadow-lg hover:bg-white/10 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  jobTitle: string;
  phoneNumber: string;
}

interface LeaveRequest {
  id: number;
  userId: number;
  userName: string;
  requestType: string;
  startDate: string;
  endDate: string | null;
  duration: number;
  durationType: string;
  reason: string;
  status: string;
  requestedBy: number;
  requestedByName: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface EmployeeWorkSchedule {
  id: number;
  employeeId: number;
  employeeName: string;
  salary: string;
  scheduleType: string;
  continuousStartTime?: string;
  continuousEndTime?: string;
  morningStartTime?: string;
  morningEndTime?: string;
  eveningStartTime?: string;
  eveningEndTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DailyAttendance {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  scheduleType: string;
  continuousCheckinTime?: string;
  continuousCheckoutTime?: string;
  continuousCheckinStatus?: string;
  continuousCheckoutStatus?: string;
  morningCheckinTime?: string;
  morningCheckoutTime?: string;
  morningCheckinStatus?: string;
  morningCheckoutStatus?: string;
  eveningCheckinTime?: string;
  eveningCheckoutTime?: string;
  eveningCheckinStatus?: string;
  eveningCheckoutStatus?: string;
  totalHoursWorked?: string;
  notes?: string;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceManagementPageProps {
  userRole: string;
  username: string;
  userId: number;
}

export default function AttendanceManagementPage({ userRole, username, userId }: AttendanceManagementPageProps) {
  const [selectedTab, setSelectedTab] = useState("pending-requests");
  const [isCreateScheduleDialogOpen, setIsCreateScheduleDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [scheduleType, setScheduleType] = useState<string>("متصل");
  const [salary, setSalary] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedEmployeeForAttendance, setSelectedEmployeeForAttendance] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayForAttendance, setSelectedDayForAttendance] = useState<Date | null>(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedEmployeeForDialog, setSelectedEmployeeForDialog] = useState<EmployeeWorkSchedule | null>(null);
  const [isCreateRequestDialogOpen, setIsCreateRequestDialogOpen] = useState(false);
  const [isEditScheduleDialogOpen, setIsEditScheduleDialogOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState<EmployeeWorkSchedule | null>(null);
  const [collapsedEmployees, setCollapsedEmployees] = useState<Set<number>>(new Set());
  const [isEditDayDialogOpen, setIsEditDayDialogOpen] = useState(false);
  const [selectedDayForEdit, setSelectedDayForEdit] = useState<{ employee: EmployeeWorkSchedule; day: Date; attendance?: DailyAttendance } | null>(null);
  
  // Edit day form states
  const [editCheckinTime, setEditCheckinTime] = useState('12:00');
  const [editCheckoutTime, setEditCheckoutTime] = useState('22:00');
  const [editMorningCheckinTime, setEditMorningCheckinTime] = useState('09:30');
  const [editMorningCheckoutTime, setEditMorningCheckoutTime] = useState('13:00');
  const [editEveningCheckinTime, setEditEveningCheckinTime] = useState('16:00');
  const [editEveningCheckoutTime, setEditEveningCheckoutTime] = useState('21:00');
  const [editNotes, setEditNotes] = useState('');

  // Create request form states
  const [requestType, setRequestType] = useState<string>("استئذان");
  const [requestDate, setRequestDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [duration, setDuration] = useState<string>("");
  const [durationType, setDurationType] = useState<string>("ساعة");
  const [reason, setReason] = useState<string>("");

  // Schedule form states
  const [continuousStartTime, setContinuousStartTime] = useState("12:00");
  const [continuousEndTime, setContinuousEndTime] = useState("22:00");
  const [morningStartTime, setMorningStartTime] = useState("09:30");
  const [morningEndTime, setMorningEndTime] = useState("13:00");
  const [eveningStartTime, setEveningStartTime] = useState("16:00");
  const [eveningEndTime, setEveningEndTime] = useState("21:00");

  // Define permissions based on user role
  const canApproveRequests = ["admin", "sales_director"].includes(userRole);
  const canManageSchedules = ["admin", "sales_director"].includes(userRole);
  const canManageAttendance = ["admin", "sales_director", "accountant"].includes(userRole);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch pending leave requests
  const { data: pendingLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
    select: (data) => data.filter(request => request.status === "pending"),
  });

  // Fetch approved leave requests
  const { data: approvedLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
    select: (data) => data.filter(request => request.status === "approved"),
  });

  // Fetch employee work schedules
  const { data: workSchedules = [] } = useQuery<EmployeeWorkSchedule[]>({
    queryKey: ["/api/employee-work-schedules"],
  });

  // Fetch all daily attendance data
  const { data: dailyAttendance = [], refetch: refetchAttendance } = useQuery<DailyAttendance[]>({
    queryKey: ["/api/daily-attendance"],
    refetchInterval: 30000, // Refetch every 30 seconds instead of 2 seconds
  });

  // Set default scheduled times when attendance dialog opens
  useEffect(() => {
    if (isAttendanceDialogOpen && selectedEmployeeForDialog) {
      const existingAttendance = dailyAttendance?.find((record: DailyAttendance) => 
        record.employeeId === selectedEmployeeForDialog.employeeId && 
        record.date === selectedDayForAttendance?.toISOString().split('T')[0]
      );
      
      if (!existingAttendance) {
        setTimeout(() => {
          // التحقق من يوم الجمعة (دوام خاص من 4:00 مساءً إلى 9:00 مساءً)
          const isFriday = selectedDayForAttendance && format(selectedDayForAttendance, "EEEE", { locale: ar }) === "الجمعة";
          
          let defaultTimes;
          
          if (isFriday) {
            // أوقات الجمعة الخاصة لجميع أنواع الدوام
            defaultTimes = {
              'continuous-checkin-time': '16:00',    // 4:00 PM
              'continuous-checkout-time': '21:00',   // 9:00 PM
              'morning-checkin-time': '16:00',       // 4:00 PM
              'morning-checkout-time': '21:00',      // 9:00 PM
              'evening-checkin-time': '16:00',       // 4:00 PM
              'evening-checkout-time': '21:00'       // 9:00 PM
            };
          } else {
            // الأوقات الافتراضية للأيام العادية
            defaultTimes = {
              'continuous-checkin-time': '12:00',    // 12:00 PM
              'continuous-checkout-time': '22:00',   // 10:00 PM
              'morning-checkin-time': '09:30',       // 09:30 AM
              'morning-checkout-time': '13:00',      // 01:00 PM
              'evening-checkin-time': '16:00',       // 04:00 PM
              'evening-checkout-time': '21:00'       // 09:00 PM
            };
          }
          
          Object.entries(defaultTimes).forEach(([inputId, defaultTime]) => {
            const input = document.getElementById(inputId) as HTMLInputElement;
            if (input) {
              input.value = defaultTime;
            }
          });
        }, 100);
      }
    }
  }, [isAttendanceDialogOpen, selectedEmployeeForDialog, selectedDayForAttendance, dailyAttendance]);

  // Filter work schedules
  const filteredSchedules = workSchedules.filter(schedule =>
    employeeFilter === "" || 
    schedule.employeeName.toLowerCase().includes(employeeFilter.toLowerCase())
  );

  // Export attendance data to Excel with notes included
  const exportAttendanceToExcel = () => {
    if (dailyAttendance.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "لا توجد بيانات حضور متاحة للتصدير",
        variant: "destructive",
      });
      return;
    }

    const exportData = dailyAttendance.map((attendance: DailyAttendance) => ({
      'اسم الموظف': attendance.employeeName,
      'التاريخ': new Date(attendance.date).toLocaleDateString('ar-SA'),
      'نوع الدوام': attendance.scheduleType,
      'حضور صباحي': attendance.morningCheckinTime || '-',
      'انصراف صباحي': attendance.morningCheckoutTime || '-',
      'حضور مسائي': attendance.eveningCheckinTime || '-',
      'انصراف مسائي': attendance.eveningCheckoutTime || '-',
      'حضور متصل': attendance.continuousCheckinTime || '-',
      'انصراف متصل': attendance.continuousCheckoutTime || '-',
      'ساعات العمل': attendance.totalHoursWorked || '-',
      'الملاحظات': attendance.notes || 'لا يوجد',
      'تم الإنشاء بواسطة': attendance.createdByName || '-',
      'تاريخ الإنشاء': new Date(attendance.createdAt).toLocaleDateString('ar-SA')
    }));

    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'بيانات الحضور');
      
      // Set column widths for better formatting
      const colWidths = [
        { wch: 20 }, // اسم الموظف
        { wch: 12 }, // التاريخ
        { wch: 10 }, // نوع الدوام
        { wch: 12 }, // حضور صباحي
        { wch: 12 }, // انصراف صباحي
        { wch: 12 }, // حضور مسائي
        { wch: 12 }, // انصراف مسائي
        { wch: 12 }, // حضور متصل
        { wch: 12 }, // انصراف متصل
        { wch: 12 }, // ساعات العمل
        { wch: 25 }, // الملاحظات
        { wch: 15 }, // تم الإنشاء بواسطة
        { wch: 15 }  // تاريخ الإنشاء
      ];
      ws['!cols'] = colWidths;

      const fileName = `تقرير_الحضور_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "تم تصدير البيانات",
        description: "تم تصدير بيانات الحضور بنجاح مع الملاحظات",
      });
    }).catch((error) => {
      console.error('Error importing XLSX:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    });
  };

  // Approve/Reject leave request mutation
  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      const response = await fetch(`/api/leave-requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status, 
          rejectionReason,
          approvedBy: userId,
          approvedByName: username
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
    },
    onError: () => {
      toast({
        title: "خطأ في تحديث الطلب",
        description: "حدث خطأ أثناء تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  // Create leave request mutation
  const createLeaveRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...requestData,
          requestedBy: userId,
          requestedByName: username,
          status: "pending"
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الطلب",
        description: "تم إرسال طلب الإجازة/الاستئذان بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setIsCreateRequestDialogOpen(false);
      resetRequestForm();
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء الطلب",
        description: "حدث خطأ أثناء إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  // Reset request form
  const resetRequestForm = () => {
    setRequestType("استئذان");
    setRequestDate(format(new Date(), "yyyy-MM-dd"));
    setDuration("");
    setDurationType("ساعة");
    setReason("");
  };

  // Handle create request
  const handleCreateRequest = () => {
    if (!duration || !reason) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      userId: userId,
      userName: username,
      requestType,
      startDate: requestDate,
      endDate: requestType === "إجازة" ? requestDate : null,
      duration: parseInt(duration),
      durationType: requestType === "إجازة" ? "يوم" : durationType,
      reason,
    };

    createLeaveRequestMutation.mutate(requestData);
  };

  // Create work schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const response = await fetch("/api/employee-work-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء الجدول الزمني",
        description: "تم إنشاء جدول العمل للموظف بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-work-schedules"] });
      setIsCreateScheduleDialogOpen(false);
      resetScheduleForm();
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء الجدول",
        description: "حدث خطأ أثناء إنشاء جدول العمل",
        variant: "destructive",
      });
    },
  });

  // Update work schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const response = await fetch(`/api/employee-work-schedules/${scheduleData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الجدول الزمني",
        description: "تم تحديث جدول العمل بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-work-schedules"] });
      setIsEditScheduleDialogOpen(false);
      setSelectedScheduleForEdit(null);
      resetScheduleForm();
    },
    onError: () => {
      toast({
        title: "خطأ في تحديث الجدول",
        description: "حدث خطأ أثناء تحديث جدول العمل",
        variant: "destructive",
      });
    },
  });

  // Delete work schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      const response = await fetch(`/api/employee-work-schedules/${scheduleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حذف الجدول الزمني",
        description: "تم حذف جدول العمل بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-work-schedules"] });
    },
    onError: () => {
      toast({
        title: "خطأ في حذف الجدول",
        description: "حدث خطأ أثناء حذف جدول العمل",
        variant: "destructive",
      });
    },
  });

  // Reset schedule form
  const resetScheduleForm = () => {
    setSelectedEmployeeId("");
    setSalary("");
    setScheduleType("متصل");
    setContinuousStartTime("12:00");
    setContinuousEndTime("22:00");
    setMorningStartTime("09:30");
    setMorningEndTime("13:00");
    setEveningStartTime("16:00");
    setEveningEndTime("21:00");
  };

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, updateData }: { 
      attendanceId: number; 
      updateData: any;
    }) => {
      console.log('Sending PUT request to:', `/api/daily-attendance/${attendanceId}`);
      console.log('With data:', updateData);
      
      const response = await fetch(`/api/daily-attendance/${attendanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Update response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Attendance update successful:', data);
      toast({
        title: "تم تحديث الحضور",
        description: "تم تحديث بيانات الحضور بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-attendance"] });
      queryClient.refetchQueries({ queryKey: ["/api/daily-attendance"] });
      // Don't close dialog automatically to allow multiple updates
    },
    onError: (error) => {
      console.error('Attendance update error:', error);
      toast({
        title: "خطأ في تحديث الحضور",
        description: error.message || "حدث خطأ أثناء تحديث بيانات الحضور",
        variant: "destructive",
      });
    },
  });

  const handleApproveRequest = (id: number) => {
    updateRequestStatusMutation.mutate({ id, status: "approved" });
  };

  const handleRejectRequest = (id: number, rejectionReason?: string) => {
    updateRequestStatusMutation.mutate({ id, status: "rejected", rejectionReason });
  };

  const handleCreateSchedule = () => {
    if (!selectedEmployeeId || !salary) return;

    const selectedUser = users.find(u => u.id === parseInt(selectedEmployeeId));
    if (!selectedUser) return;

    const scheduleData = {
      employeeId: parseInt(selectedEmployeeId),
      employeeName: selectedUser.name,
      salary: parseFloat(salary).toString(),
      scheduleType,
      ...(scheduleType === "متصل" 
        ? {
            continuousStartTime,
            continuousEndTime
          }
        : {
            morningStartTime,
            morningEndTime,
            eveningStartTime,
            eveningEndTime
          }
      )
    };

    createScheduleMutation.mutate(scheduleData);
  };

  // Handle editing a schedule
  const handleEditSchedule = (schedule: EmployeeWorkSchedule) => {
    setSelectedScheduleForEdit(schedule);
    setSelectedEmployeeId(schedule.employeeId.toString());
    setSalary(schedule.salary);
    setScheduleType(schedule.scheduleType);
    
    if (schedule.scheduleType === "متصل") {
      setContinuousStartTime(schedule.continuousStartTime || "12:00");
      setContinuousEndTime(schedule.continuousEndTime || "22:00");
    } else {
      setMorningStartTime(schedule.morningStartTime || "09:30");
      setMorningEndTime(schedule.morningEndTime || "13:00");
      setEveningStartTime(schedule.eveningStartTime || "16:00");
      setEveningEndTime(schedule.eveningEndTime || "21:00");
    }
    
    setIsEditScheduleDialogOpen(true);
  };

  // Handle updating a schedule
  const handleUpdateSchedule = () => {
    if (!selectedScheduleForEdit || !salary) return;

    const scheduleData = {
      id: selectedScheduleForEdit.id,
      employeeId: selectedScheduleForEdit.employeeId,
      employeeName: selectedScheduleForEdit.employeeName,
      salary: parseFloat(salary).toString(),
      scheduleType,
      ...(scheduleType === "متصل" 
        ? {
            continuousStartTime,
            continuousEndTime
          }
        : {
            morningStartTime,
            morningEndTime,
            eveningStartTime,
            eveningEndTime
          }
      )
    };

    updateScheduleMutation.mutate(scheduleData);
  };

  // Handle deleting a schedule
  const handleDeleteSchedule = (scheduleId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الجدول الزمني؟")) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const handleAttendanceUpdate = (attendanceId: number, field: string, value: string) => {
    console.log('Frontend updating attendance:', { attendanceId, field, value });
    
    // Find the attendance record to update
    const existingAttendance = dailyAttendance.find(a => a.id === attendanceId);
    if (!existingAttendance) {
      console.error('Attendance record not found for ID:', attendanceId);
      return;
    }
    
    // Create update payload with the specific field
    const updatePayload = {
      ...existingAttendance,
      [field]: value,
      // Ensure date is in correct format
      date: typeof existingAttendance.date === 'string' ? 
        existingAttendance.date.split('T')[0] : 
        format(new Date(existingAttendance.date), 'yyyy-MM-dd')
    };
    
    console.log('Sending update payload:', updatePayload);
    updateAttendanceMutation.mutate({ attendanceId, updateData: updatePayload });
  };

  // Create daily attendance record
  const createAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/daily-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("فشل في إنشاء سجل الحضور");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-attendance"] });
      queryClient.refetchQueries({ queryKey: ["/api/daily-attendance"] });
      toast({ title: "تم تسجيل الحضور بنجاح" });
      setIsAttendanceDialogOpen(false);
    },
    onError: (error) => {
      console.error("Attendance creation error:", error);
      toast({ title: "خطأ في تسجيل الحضور", variant: "destructive" });
    },
  });

  // Mark day as holiday
  const markHolidayMutation = useMutation({
    mutationFn: async (data: { employeeId: number; date: string; isHoliday: boolean }) => {
      const response = await fetch("/api/daily-attendance/holiday", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("فشل في تحديث حالة الإجازة");
      return response.json();
    },
    onSuccess: (data) => {
      // Force refresh both queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["/api/daily-attendance"] });
      queryClient.refetchQueries({ queryKey: ["/api/daily-attendance"] });
      
      // Also refresh other related queries
      queryClient.invalidateQueries({ queryKey: ["/api/employee-work-schedules"] });
      
      // Force re-fetch attendance data immediately
      refetchAttendance();
      
      toast({ 
        title: "تم تحديد اليوم كإجازة بنجاح", 
        description: `تم تحديث حالة يوم ${format(selectedDayForAttendance!, "dd/MM/yyyy", { locale: ar })} بنجاح` 
      });
      setIsAttendanceDialogOpen(false);
      
      // Small delay to allow data to propagate
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/daily-attendance"] });
      }, 100);
    },
    onError: (error) => {
      console.error("Holiday marking error:", error);
      toast({ title: "خطأ في تحديد الإجازة", description: "يرجى المحاولة مرة أخرى", variant: "destructive" });
    },
  });

  // Get calendar days for current month (only current and past days)
  const getMonthDays = () => {
    const start = startOfMonth(currentMonth);
    const today = new Date();
    const end = isBefore(endOfMonth(currentMonth), today) ? endOfMonth(currentMonth) : today;
    return eachDayOfInterval({ start, end });
  };

  // Get attendance for specific employee and month
  const getEmployeeMonthAttendance = (employeeId: number) => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    return dailyAttendance.filter(attendance => {
      const attendanceDate = typeof attendance.date === 'string' ? attendance.date : format(new Date(attendance.date), 'yyyy-MM-dd');
      const normalizedAttendanceDate = attendanceDate.split('T')[0]; // Remove time part if present
      return attendance.employeeId === employeeId && 
        normalizedAttendanceDate >= start && 
        normalizedAttendanceDate <= end;
    });
  };

  // Handle clicking on employee to show monthly calendar
  const handleEmployeeClick = (employee: EmployeeWorkSchedule) => {
    setSelectedEmployeeForAttendance(employee.employeeId);
  };

  // Toggle employee collapse state
  const toggleEmployeeCollapse = (employeeId: number) => {
    const newCollapsed = new Set(collapsedEmployees);
    if (newCollapsed.has(employeeId)) {
      newCollapsed.delete(employeeId);
    } else {
      newCollapsed.add(employeeId);
    }
    setCollapsedEmployees(newCollapsed);
  };

  // Handle editing a specific day's attendance
  const handleEditDay = (employee: EmployeeWorkSchedule, day: Date, attendance?: DailyAttendance) => {
    setSelectedDayForEdit({ employee, day, attendance });
    
    // Set default values based on existing attendance or schedule defaults
    if (attendance) {
      setEditCheckinTime(attendance.continuousCheckinTime || '12:00');
      setEditCheckoutTime(attendance.continuousCheckoutTime || '22:00');
      setEditMorningCheckinTime(attendance.morningCheckinTime || '09:30');
      setEditMorningCheckoutTime(attendance.morningCheckoutTime || '13:00');
      setEditEveningCheckinTime(attendance.eveningCheckinTime || '16:00');
      setEditEveningCheckoutTime(attendance.eveningCheckoutTime || '21:00');
      setEditNotes(attendance.notes || '');
    } else {
      // Set schedule defaults for new records
      setEditCheckinTime(employee.continuousStartTime || '12:00');
      setEditCheckoutTime(employee.continuousEndTime || '22:00');
      setEditMorningCheckinTime(employee.morningStartTime || '09:30');
      setEditMorningCheckoutTime(employee.morningEndTime || '13:00');
      setEditEveningCheckinTime(employee.eveningStartTime || '16:00');
      setEditEveningCheckoutTime(employee.eveningEndTime || '21:00');
      setEditNotes('');
    }
    
    setIsEditDayDialogOpen(true);
  };

  // Handle day click to show attendance dialog
  const handleDayClick = (day: Date, employee: EmployeeWorkSchedule) => {
    setSelectedDayForAttendance(day);
    setSelectedEmployeeForDialog(employee);
    setIsAttendanceDialogOpen(true);
  };

  // Confirm attendance for a specific day
  const handleConfirmAttendance = (type: 'checkin' | 'checkout', time: string, period?: 'morning' | 'evening') => {
    if (!selectedDayForAttendance || !selectedEmployeeForDialog) return;
    
    const dateStr = format(selectedDayForAttendance, "yyyy-MM-dd");
    let attendance = dailyAttendance.find(a => {
      const attendanceDate = typeof a.date === 'string' ? a.date : format(new Date(a.date), 'yyyy-MM-dd');
      const normalizedAttendanceDate = attendanceDate.split('T')[0]; // Remove time part if present
      return a.employeeId === selectedEmployeeForDialog.employeeId && normalizedAttendanceDate === dateStr;
    });

    if (!attendance) {
      // Create new attendance record with proper timing data
      const attendanceData = {
        employeeId: selectedEmployeeForDialog.employeeId,
        employeeName: selectedEmployeeForDialog.employeeName,
        date: dateStr,
        scheduleType: selectedEmployeeForDialog.scheduleType,
        // Add the timing data immediately when creating
        ...(selectedEmployeeForDialog.scheduleType === "متصل" 
          ? {
              [type === 'checkin' ? 'continuousCheckinTime' : 'continuousCheckoutTime']: time
            }
          : {
              ...(period === 'morning' 
                ? { [type === 'checkin' ? 'morningCheckinTime' : 'morningCheckoutTime']: time }
                : { [type === 'checkin' ? 'eveningCheckinTime' : 'eveningCheckoutTime']: time }
              )
            }
        )
      };
      
      console.log('Creating new attendance record:', attendanceData);
      createAttendanceMutation.mutate(attendanceData);
    } else {
      // Update existing attendance
      let field: string;
      
      if (selectedEmployeeForDialog.scheduleType === "متصل") {
        field = type === 'checkin' ? 'continuousCheckinTime' : 'continuousCheckoutTime';
      } else {
        // For split schedule, determine field based on period
        if (period === 'morning') {
          field = type === 'checkin' ? 'morningCheckinTime' : 'morningCheckoutTime';
        } else {
          field = type === 'checkin' ? 'eveningCheckinTime' : 'eveningCheckoutTime';
        }
      }
      
      handleAttendanceUpdate(attendance.id, field, time);
    }
    
    // Dialog will be closed by the mutation success handler
  };

  // Handle printing approved requests
  const handlePrintRequest = (request: LeaveRequest) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طلب إجازة/استئذان معتمد - ${request.userName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
            background: white;
            color: #333;
            line-height: 1.6;
            padding: 40px;
            direction: rtl;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #0891b2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #0891b2;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .header p {
            color: #64748b;
            font-size: 16px;
          }
          
          .request-card {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 30px;
            margin: 20px 0;
            background: #f8fafc;
          }
          
          .request-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .request-title {
            font-size: 22px;
            font-weight: 600;
            color: #1e293b;
          }
          
          .status-badge {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 500;
            font-size: 14px;
          }
          
          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .detail-item {
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          
          .detail-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .detail-value {
            font-size: 16px;
            color: #1e293b;
            font-weight: 500;
          }
          
          .reason-section {
            margin: 20px 0;
            padding: 20px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          
          .reason-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .reason-text {
            color: #475569;
            line-height: 1.7;
            font-size: 15px;
          }
          
          .approval-section {
            background: #dcfdf7;
            border: 1px solid #6ee7b7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .approval-title {
            color: #059669;
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>طلب إجازة/استئذان معتمد</h1>
          <p>نظام إدارة الموارد البشرية</p>
        </div>
        
        <div class="request-card">
          <div class="request-header">
            <div class="request-title">${request.requestType} - ${request.userName}</div>
            <div class="status-badge">معتمد ✓</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">اسم الموظف</div>
              <div class="detail-value">${request.userName}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">نوع الطلب</div>
              <div class="detail-value">${request.requestType}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">تاريخ البداية</div>
              <div class="detail-value">${new Date(request.startDate).toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric', 
                month: 'long',
                day: 'numeric'
              })}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">المدة</div>
              <div class="detail-value">${request.duration} ${request.durationType}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">رقم الطلب</div>
              <div class="detail-value">#${request.id}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">تاريخ تقديم الطلب</div>
              <div class="detail-value">${new Date(request.createdAt).toLocaleDateString('ar-SA')}</div>
            </div>
          </div>
          
          ${request.reason ? `
            <div class="reason-section">
              <div class="reason-title">سبب الطلب:</div>
              <div class="reason-text">${request.reason}</div>
            </div>
          ` : ''}
          
          <div class="approval-section">
            <div class="approval-title">
              ✓ تم اعتماد الطلب
            </div>
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">المسؤول المعتمد</div>
                <div class="detail-value">${request.approvedByName || 'غير محدد'}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">تاريخ الاعتماد</div>
                <div class="detail-value">${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('ar-SA') : 'غير محدد'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>تم إنشاء هذا التقرير في: ${new Date().toLocaleString('ar-SA')}</p>
          <p>نظام إدارة الموارد البشرية - ${new Date().getFullYear()}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Handle both checkin and checkout in one operation
  const handleConfirmBothAttendance = (checkinTime: string, checkoutTime: string, period?: 'morning' | 'evening') => {
    if (!selectedDayForAttendance || !selectedEmployeeForDialog) return;
    
    const dateStr = format(selectedDayForAttendance, "yyyy-MM-dd");
    let attendance = dailyAttendance.find(a => {
      const attendanceDate = typeof a.date === 'string' ? a.date : format(new Date(a.date), 'yyyy-MM-dd');
      const normalizedAttendanceDate = attendanceDate.split('T')[0]; // Remove time part if present
      return a.employeeId === selectedEmployeeForDialog.employeeId && normalizedAttendanceDate === dateStr;
    });

    if (!attendance) {
      // Create new attendance record with both times
      const attendanceData = {
        employeeId: selectedEmployeeForDialog.employeeId,
        employeeName: selectedEmployeeForDialog.employeeName,
        date: dateStr,
        scheduleType: selectedEmployeeForDialog.scheduleType,
        // Add both timing data when creating
        ...(selectedEmployeeForDialog.scheduleType === "متصل" 
          ? {
              continuousCheckinTime: checkinTime,
              continuousCheckoutTime: checkoutTime
            }
          : {
              ...(period === 'morning' 
                ? { 
                    morningCheckinTime: checkinTime,
                    morningCheckoutTime: checkoutTime
                  }
                : { 
                    eveningCheckinTime: checkinTime,
                    eveningCheckoutTime: checkoutTime
                  }
              )
            }
        )
      };
      
      createAttendanceMutation.mutate(attendanceData);
    } else {
      // Update existing attendance with both times
      if (selectedEmployeeForDialog.scheduleType === "متصل") {
        handleAttendanceUpdate(attendance.id, 'continuousCheckinTime', checkinTime);
        setTimeout(() => handleAttendanceUpdate(attendance.id, 'continuousCheckoutTime', checkoutTime), 100);
      } else {
        // For split schedule, determine fields based on period
        if (period === 'morning') {
          handleAttendanceUpdate(attendance.id, 'morningCheckinTime', checkinTime);
          setTimeout(() => handleAttendanceUpdate(attendance.id, 'morningCheckoutTime', checkoutTime), 100);
        } else {
          handleAttendanceUpdate(attendance.id, 'eveningCheckinTime', checkinTime);
          setTimeout(() => handleAttendanceUpdate(attendance.id, 'eveningCheckoutTime', checkoutTime), 100);
        }
      }
    }
  };

  // Check if employee is late
  const isEmployeeLate = (employee: EmployeeWorkSchedule, day: Date): boolean => {
    const dateStr = format(day, "yyyy-MM-dd");
    const attendance = dailyAttendance.find(a => {
      const attendanceDate = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd');
      return a.employeeId === employee.employeeId && attendanceDate === dateStr;
    });

    if (!attendance) return false;

    // التحقق من يوم الجمعة (دوام خاص من 4:00 مساءً إلى 9:00 مساءً)
    const isFriday = format(day, "EEEE", { locale: ar }) === "الجمعة";
    
    if (isFriday) {
      // يوم الجمعة: التحقق من وقت الحضور الخاص (4:00 PM)
      const fridayStartTime = "16:00"; // 4:00 PM
      if (employee.scheduleType === "متصل") {
        if (attendance.continuousCheckinTime) {
          return attendance.continuousCheckinTime > fridayStartTime;
        }
      } else {
        // للدوام المنفصل، نتحقق من الفترة المسائية في يوم الجمعة
        if (attendance.eveningCheckinTime) {
          return attendance.eveningCheckinTime > fridayStartTime;
        }
        // إذا سجل في الفترة الصباحية بدلاً من المسائية، نتحقق أيضاً
        if (attendance.morningCheckinTime) {
          return attendance.morningCheckinTime > fridayStartTime;
        }
      }
      return false;
    }

    // الأيام العادية: استخدام الجدول المعتاد
    if (employee.scheduleType === "متصل") {
      if (attendance.continuousCheckinTime && employee.continuousStartTime) {
        return attendance.continuousCheckinTime > employee.continuousStartTime;
      }
    } else {
      if (attendance.morningCheckinTime && employee.morningStartTime) {
        return attendance.morningCheckinTime > employee.morningStartTime;
      }
    }

    return false;
  };

  // Check if day is a holiday/leave
  const isDayHoliday = (employee: EmployeeWorkSchedule, day: Date): boolean => {
    const dateStr = format(day, "yyyy-MM-dd");
    const attendance = dailyAttendance.find(a => {
      const attendanceDate = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd');
      return a.employeeId === employee.employeeId && attendanceDate === dateStr;
    });
    
    return attendance?.notes === "إجازة";
  };

  // Fetch all leave requests for checking approved leave
  const { data: allLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  // Check if employee has approved leave for a specific day
  const hasApprovedLeave = (employeeId: number, day: Date): boolean => {
    const dateStr = format(day, "yyyy-MM-dd");
    return allLeaveRequests.some(request => 
      request.userId === employeeId &&
      request.status === "approved" &&
      format(new Date(request.startDate), "yyyy-MM-dd") <= dateStr &&
      (request.endDate ? format(new Date(request.endDate), "yyyy-MM-dd") >= dateStr : format(new Date(request.startDate), "yyyy-MM-dd") === dateStr)
    );
  };

  // Get approved leave request details for a specific day
  const getApprovedLeaveForDay = (employeeId: number, day: Date): LeaveRequest | null => {
    const dateStr = format(day, "yyyy-MM-dd");
    return allLeaveRequests.find(request => 
      request.userId === employeeId &&
      request.status === "approved" &&
      format(new Date(request.startDate), "yyyy-MM-dd") <= dateStr &&
      (request.endDate ? format(new Date(request.endDate), "yyyy-MM-dd") >= dateStr : format(new Date(request.startDate), "yyyy-MM-dd") === dateStr)
    ) || null;
  };

  // Mark day as holiday
  const handleMarkHoliday = () => {
    if (!selectedDayForAttendance || !selectedEmployeeForDialog) return;
    
    const dateStr = format(selectedDayForAttendance, "yyyy-MM-dd");
    const existingAttendance = dailyAttendance.find(a => {
      const attendanceDate = typeof a.date === 'string' ? a.date : format(new Date(a.date), 'yyyy-MM-dd');
      const normalizedAttendanceDate = attendanceDate.split('T')[0]; // Remove time part if present
      return a.employeeId === selectedEmployeeForDialog.employeeId && normalizedAttendanceDate === dateStr;
    });
    
    // Toggle holiday status if record exists
    const isCurrentlyHoliday = existingAttendance?.notes === 'إجازة';
    
    markHolidayMutation.mutate({
      employeeId: selectedEmployeeForDialog.employeeId,
      date: dateStr,
      isHoliday: !isCurrentlyHoliday
    });
  };

  const calculateHoursWorked = (schedule: EmployeeWorkSchedule, attendance: DailyAttendance, day?: Date): string => {
    console.log('Calculating hours for:', { scheduleType: schedule.scheduleType, attendance });
    
    // إذا كانت الحالة إجازة، لا توجد ساعات عمل
    if (attendance.notes === 'إجازة') {
      console.log('Day marked as holiday, no work hours');
      return "0.00";
    }
    
    // التحقق من يوم الجمعة (دوام خاص من 4:00 مساءً إلى 9:00 مساءً)
    const isFriday = day && format(day, "EEEE", { locale: ar }) === "الجمعة";
    
    // استخدام نفس التاريخ للمقارنة لضمان دقة الحسابات
    const baseDate = day ? format(day, 'yyyy-MM-dd') : '2024-01-01';
    
    if (schedule.scheduleType === "متصل" || isFriday) {
      if (attendance.continuousCheckinTime && attendance.continuousCheckoutTime) {
        try {
          const checkin = new Date(`${baseDate}T${attendance.continuousCheckinTime}:00`);
          const checkout = new Date(`${baseDate}T${attendance.continuousCheckoutTime}:00`);
          const diff = Math.max(0, (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60));
          console.log('Continuous hours calculated:', diff.toFixed(2));
          return diff.toFixed(2);
        } catch (error) {
          console.error('Error calculating continuous hours:', error);
          return "0.00";
        }
      }
      // يوم الجمعة: تحقق من سجل الحضور في الفترة المسائية للدوام المنفصل
      if (isFriday && schedule.scheduleType === "منفصل") {
        if (attendance.eveningCheckinTime && attendance.eveningCheckoutTime) {
          try {
            const eveningCheckin = new Date(`${baseDate}T${attendance.eveningCheckinTime}:00`);
            const eveningCheckout = new Date(`${baseDate}T${attendance.eveningCheckoutTime}:00`);
            const eveningHours = Math.max(0, (eveningCheckout.getTime() - eveningCheckin.getTime()) / (1000 * 60 * 60));
            console.log('Friday evening hours:', eveningHours.toFixed(2));
            return eveningHours.toFixed(2);
          } catch (error) {
            console.error('Error calculating Friday evening hours:', error);
          }
        }
        // تحقق من سجل الحضور في الفترة الصباحية كبديل
        if (attendance.morningCheckinTime && attendance.morningCheckoutTime) {
          try {
            const morningCheckin = new Date(`${baseDate}T${attendance.morningCheckinTime}:00`);
            const morningCheckout = new Date(`${baseDate}T${attendance.morningCheckoutTime}:00`);
            const morningHours = Math.max(0, (morningCheckout.getTime() - morningCheckin.getTime()) / (1000 * 60 * 60));
            console.log('Friday morning hours (fallback):', morningHours.toFixed(2));
            return morningHours.toFixed(2);
          } catch (error) {
            console.error('Error calculating Friday morning hours:', error);
          }
        }
      }
    } else {
      // الدوام المنفصل للأيام العادية
      let totalHours = 0;
      
      // Morning shift
      if (attendance.morningCheckinTime && attendance.morningCheckoutTime) {
        try {
          const morningCheckin = new Date(`${baseDate}T${attendance.morningCheckinTime}:00`);
          const morningCheckout = new Date(`${baseDate}T${attendance.morningCheckoutTime}:00`);
          const morningHours = Math.max(0, (morningCheckout.getTime() - morningCheckin.getTime()) / (1000 * 60 * 60));
          totalHours += morningHours;
          console.log('Morning hours:', morningHours.toFixed(2));
        } catch (error) {
          console.error('Error calculating morning hours:', error);
        }
      }
      
      // Evening shift
      if (attendance.eveningCheckinTime && attendance.eveningCheckoutTime) {
        try {
          const eveningCheckin = new Date(`${baseDate}T${attendance.eveningCheckinTime}:00`);
          const eveningCheckout = new Date(`${baseDate}T${attendance.eveningCheckoutTime}:00`);
          const eveningHours = Math.max(0, (eveningCheckout.getTime() - eveningCheckin.getTime()) / (1000 * 60 * 60));
          totalHours += eveningHours;
          console.log('Evening hours:', eveningHours.toFixed(2));
        } catch (error) {
          console.error('Error calculating evening hours:', error);
        }
      }
      
      console.log('Total hours calculated:', totalHours.toFixed(2));
      return totalHours.toFixed(2);
    }
    
    console.log('No hours calculated, returning 0.00');
    return "0.00";
  };

  // حساب الساعات المتوقعة بناءً على جدول العمل الفعلي
  const calculateExpectedHours = (schedule: EmployeeWorkSchedule, day?: Date): number => {
    // قائمة الموظفين الذين يتم حساب الدوام لهم على أساس ساعات العمل الإجمالية
    const hoursBasedEmployees = [
      'احمد كمال', 'أحمد كمال',
      'فاروق الغنامي',
      'صادق الغنامي', 
      'ايمن المليكي', 'أيمن المليكي',
      'ساوي'
    ];
    
    const isHourBasedEmployee = hoursBasedEmployees.some(name => 
      schedule.employeeName.includes(name) || name.includes(schedule.employeeName)
    );
    
    // التحقق من يوم الجمعة 
    if (day && format(day, "EEEE", { locale: ar }) === "الجمعة") {
      // جميع الموظفين: 5 ساعات في يوم الجمعة (4:00 PM - 9:00 PM)
      return 5;
    }
    
    if (schedule.scheduleType === "متصل") {
      if (schedule.continuousStartTime && schedule.continuousEndTime) {
        const startTime = new Date(`2024-01-01T${schedule.continuousStartTime}`);
        const endTime = new Date(`2024-01-01T${schedule.continuousEndTime}`);
        return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      }
    } else {
      let totalExpectedHours = 0;
      if (schedule.morningStartTime && schedule.morningEndTime) {
        const morningStart = new Date(`2024-01-01T${schedule.morningStartTime}`);
        const morningEnd = new Date(`2024-01-01T${schedule.morningEndTime}`);
        totalExpectedHours += (morningEnd.getTime() - morningStart.getTime()) / (1000 * 60 * 60);
      }
      if (schedule.eveningStartTime && schedule.eveningEndTime) {
        const eveningStart = new Date(`2024-01-01T${schedule.eveningStartTime}`);
        const eveningEnd = new Date(`2024-01-01T${schedule.eveningEndTime}`);
        totalExpectedHours += (eveningEnd.getTime() - eveningStart.getTime()) / (1000 * 60 * 60);
      }
      return totalExpectedHours;
    }
    return 8; // Default fallback
  };

  // حساب ساعات التأخير والإنصراف المبكر
  const calculateDelayHours = (schedule: EmployeeWorkSchedule, attendance: DailyAttendance, day: Date): number => {
    let totalDelayHours = 0;
    
    // تحقق من وجود بيانات الحضور
    if (!attendance) return 0;
    
    // التحقق من يوم الجمعة مع دوام إضافة - لا يتم احتساب تأخير
    const fridayCheck = format(day, "EEEE", { locale: ar }) === "الجمعة";
    if (fridayCheck && attendance.notes === 'دوام إضافة') {
      console.log('Friday overtime shift - no delay calculation');
      return 0; // لا يتم احتساب تأخير في دوام الإضافة
    }
    
    // قائمة الموظفين الذين يتم حساب الدوام لهم على أساس ساعات العمل الإجمالية
    const hoursBasedEmployees = [
      'احمد كمال', 'أحمد كمال',
      'فاروق الغنامي',
      'صادق الغنامي', 
      'ايمن المليكي', 'أيمن المليكي',
      'ساوي'
    ];
    
    // التحقق إذا كان الموظف من الموظفين الذين يحسب دوامهم بالساعات
    const isHourBasedEmployee = hoursBasedEmployees.some(name => 
      schedule.employeeName.includes(name) || name.includes(schedule.employeeName)
    );
    
    console.log('Calculating delay for date:', format(day, 'yyyy-MM-dd'), {
      scheduleType: schedule.scheduleType,
      employeeName: schedule.employeeName,
      isHourBasedEmployee,
      attendance: {
        morningCheckin: attendance.morningCheckinTime,
        morningCheckout: attendance.morningCheckoutTime,
        eveningCheckin: attendance.eveningCheckinTime,
        eveningCheckout: attendance.eveningCheckoutTime,
        continuousCheckin: attendance.continuousCheckinTime,
        continuousCheckout: attendance.continuousCheckoutTime
      }
    });
    
    // للموظفين الذين يحسب دوامهم بالساعات
    if (isHourBasedEmployee) {
      const actualWorkHours = parseFloat(calculateHoursWorked(schedule, attendance, day));
      const isFriday = format(day, "EEEE", { locale: ar }) === "الجمعة";
      const requiredHours = isFriday ? 5 : 8.5; // يوم الجمعة: 5 ساعات، الأيام العادية: 8.5 ساعة
      
      console.log('Hour-based calculation:', {
        actualWorkHours,
        requiredHours,
        isFriday,
        shortfall: Math.max(0, requiredHours - actualWorkHours)
      });
      
      // إذا كانت ساعات العمل أقل من المطلوب، احسب الفرق كتأخير
      if (actualWorkHours < requiredHours) {
        totalDelayHours = requiredHours - actualWorkHours;
      }
      
      console.log('Total delay hours calculated:', totalDelayHours);
      return totalDelayHours;
    }
    
    // التحقق من يوم الجمعة (دوام خاص من 4:00 مساءً إلى 9:00 مساءً)
    const isFriday = format(day, "EEEE", { locale: ar }) === "الجمعة";
    
    // استخدام نفس التاريخ للمقارنة لضمان دقة الحسابات
    const baseDate = format(day, 'yyyy-MM-dd');
    
    if (schedule.scheduleType === "متصل") {
      const expectedStart = isFriday ? "16:00" : schedule.continuousStartTime;
      const expectedEnd = isFriday ? "21:00" : schedule.continuousEndTime;
      
      if (expectedStart && expectedEnd && attendance.continuousCheckinTime && attendance.continuousCheckoutTime) {
        // حساب التأخير في الحضور
        const expectedStartTime = new Date(`${baseDate}T${expectedStart}:00`);
        const actualStartTime = new Date(`${baseDate}T${attendance.continuousCheckinTime}:00`);
        if (actualStartTime > expectedStartTime) {
          const delayMinutes = (actualStartTime.getTime() - expectedStartTime.getTime()) / (1000 * 60);
          totalDelayHours += delayMinutes / 60;
          console.log('Late arrival (continuous):', delayMinutes, 'minutes');
        }
        
        // حساب الإنصراف المبكر
        const expectedEndTime = new Date(`${baseDate}T${expectedEnd}:00`);
        const actualEndTime = new Date(`${baseDate}T${attendance.continuousCheckoutTime}:00`);
        if (actualEndTime < expectedEndTime) {
          const earlyLeaveMinutes = (expectedEndTime.getTime() - actualEndTime.getTime()) / (1000 * 60);
          totalDelayHours += earlyLeaveMinutes / 60;
          console.log('Early leave (continuous):', earlyLeaveMinutes, 'minutes');
        }
      }
    } else {
      // للدوام المنفصل
      if (isFriday) {
        // يوم الجمعة: الدوام من 4:00 مساءً إلى 9:00 مساءً
        const expectedFridayStart = "16:00";
        const expectedFridayEnd = "21:00";
        
        if (attendance.eveningCheckinTime) {
          const expectedStart = new Date(`${baseDate}T${expectedFridayStart}:00`);
          const actualStart = new Date(`${baseDate}T${attendance.eveningCheckinTime}:00`);
          if (actualStart > expectedStart) {
            const delayMinutes = (actualStart.getTime() - expectedStart.getTime()) / (1000 * 60);
            totalDelayHours += delayMinutes / 60;
            console.log('Friday late arrival:', delayMinutes, 'minutes');
          }
        }
        
        if (attendance.eveningCheckoutTime) {
          const expectedEnd = new Date(`${baseDate}T${expectedFridayEnd}:00`);
          const actualEnd = new Date(`${baseDate}T${attendance.eveningCheckoutTime}:00`);
          if (actualEnd < expectedEnd) {
            const earlyLeaveMinutes = (expectedEnd.getTime() - actualEnd.getTime()) / (1000 * 60);
            totalDelayHours += earlyLeaveMinutes / 60;
            console.log('Friday early leave:', earlyLeaveMinutes, 'minutes');
          }
        }
      } else {
        // الأيام العادية - الدوام المنفصل
        // الفترة الصباحية - تأخير في الحضور
        if (schedule.morningStartTime && attendance.morningCheckinTime) {
          const expectedMorningStart = new Date(`${baseDate}T${schedule.morningStartTime}:00`);
          const actualMorningStart = new Date(`${baseDate}T${attendance.morningCheckinTime}:00`);
          if (actualMorningStart > expectedMorningStart) {
            const delayMinutes = (actualMorningStart.getTime() - expectedMorningStart.getTime()) / (1000 * 60);
            totalDelayHours += delayMinutes / 60;
            console.log('Morning late arrival:', delayMinutes, 'minutes');
          }
        }
        
        // الفترة الصباحية - انصراف مبكر
        if (schedule.morningEndTime && attendance.morningCheckoutTime) {
          const expectedMorningEnd = new Date(`${baseDate}T${schedule.morningEndTime}:00`);
          const actualMorningEnd = new Date(`${baseDate}T${attendance.morningCheckoutTime}:00`);
          if (actualMorningEnd < expectedMorningEnd) {
            const earlyLeaveMinutes = (expectedMorningEnd.getTime() - actualMorningEnd.getTime()) / (1000 * 60);
            totalDelayHours += earlyLeaveMinutes / 60;
            console.log('Morning early leave:', earlyLeaveMinutes, 'minutes');
          }
        }
        
        // الفترة المسائية - تأخير في الحضور
        if (schedule.eveningStartTime && attendance.eveningCheckinTime) {
          const expectedEveningStart = new Date(`${baseDate}T${schedule.eveningStartTime}:00`);
          const actualEveningStart = new Date(`${baseDate}T${attendance.eveningCheckinTime}:00`);
          if (actualEveningStart > expectedEveningStart) {
            const delayMinutes = (actualEveningStart.getTime() - expectedEveningStart.getTime()) / (1000 * 60);
            totalDelayHours += delayMinutes / 60;
            console.log('Evening late arrival:', delayMinutes, 'minutes');
          }
        }
        
        // الفترة المسائية - انصراف مبكر
        if (schedule.eveningEndTime && attendance.eveningCheckoutTime) {
          const expectedEveningEnd = new Date(`${baseDate}T${schedule.eveningEndTime}:00`);
          const actualEveningEnd = new Date(`${baseDate}T${attendance.eveningCheckoutTime}:00`);
          if (actualEveningEnd < expectedEveningEnd) {
            const earlyLeaveMinutes = (expectedEveningEnd.getTime() - actualEveningEnd.getTime()) / (1000 * 60);
            totalDelayHours += earlyLeaveMinutes / 60;
            console.log('Evening early leave:', earlyLeaveMinutes, 'minutes');
          }
        }
      }
    }
    
    console.log('Total delay hours calculated:', totalDelayHours);
    return totalDelayHours;
  };

  // دالة تحويل الساعات العشرية إلى ساعات ودقائق
  const formatHoursToHoursMinutes = (decimalHours: number): string => {
    if (decimalHours === 0) return '0س 0د';
    
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    
    if (hours === 0) {
      return `${minutes}د`;
    } else if (minutes === 0) {
      return `${hours}س`;
    } else {
      return `${hours}س ${minutes}د`;
    }
  };

  // دالة طباعة تقرير الحضور الشهري
  const handlePrintMonthlyReport = (schedule: EmployeeWorkSchedule) => {
    const monthAttendance = getEmployeeMonthAttendance(schedule.employeeId);
    const monthDays = getMonthDays();
    const monthName = format(currentMonth, "MMMM yyyy", { locale: ar });
    
    // إنشاء محتوى التقرير
    const reportContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00627F; padding-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
            <svg width="80" height="75" viewBox="0 0 84 75" style="margin-left: 20px;">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M81.3532 31.451C57.5788 19.9162 28.5104 43.3473 12.4635 59.3186C27.787 25.6343 60.3739 5.85084 60.7356 5.6208L60.5712 5.3579C61.8207 4.47061 62.1824 2.76174 61.3933 1.41437C60.6041 0.0998539 58.927 -0.360228 57.546 0.297027L57.4144 0.0341249C55.6387 1.08574 14.3708 26.0944 1.71086 69.6376C1.18473 71.3793 1.97392 73.2196 3.58518 74.1069C4.17708 74.4355 4.80185 74.5998 5.42662 74.5998C6.51176 74.5998 7.56401 74.1398 8.32031 73.2525C14.864 65.7926 46.1356 31.7139 71.2581 35.1316C65.0104 38.2207 57.0856 42.3943 54.0275 45.0891L58.368 49.9527C61.6892 47.028 74.3491 40.7512 81.2874 37.5306C82.4712 36.9719 83.2275 35.7889 83.2275 34.5072C83.2604 33.2256 82.5041 32.0097 81.3532 31.451ZM17.2964 33.6861L13.3176 38.8455C12.7586 38.4183 -0.0655127 28.2967 0.00025207 4.70156C0.00025207 3.15703 0.920959 1.77681 2.30202 1.11957C3.71596 0.495177 5.36008 0.758087 6.51096 1.74395C8.02355 3.05845 11.0158 5.58884 14.2054 8.25068C19.5324 12.72 25.5827 17.8136 28.2462 20.2455L23.84 25.0434C21.308 22.7101 15.3234 17.6822 10.0294 13.2458C8.87849 12.2928 7.79337 11.3726 6.8069 10.5182C8.45102 26.555 16.9018 33.3904 17.2964 33.6861ZM43.4722 46.3056L49.0293 42.9208C50.4761 45.2212 54.981 51.0707 69.2191 63.9855C70.3042 64.9714 70.6988 66.4831 70.2384 67.8633C69.811 69.2435 68.5943 70.2622 67.1475 70.4265C65.4376 70.6018 63.7825 70.6894 62.1822 70.6894C41.8938 70.6894 30.3192 56.23 29.7931 55.5728L34.9228 51.5636C35.3502 52.0894 44.1956 63.0325 59.7161 64.117C51.3311 56.1972 45.8726 50.2162 43.4722 46.3056Z" fill="#C49632"/>
            </svg>
          </div>
          <h1 style="color: #00627F; font-size: 24px; margin-bottom: 10px;">تقرير الحضور والإنصراف الشهري</h1>
          <h2 style="color: #C49632; font-size: 18px; margin-bottom: 5px;">الموظف: ${schedule.employeeName}</h2>
          <h3 style="color: #00627F; font-size: 16px; margin-bottom: 5px;">شهر: ${monthName}</h3>
          <p style="color: #C49632; font-size: 14px;">نوع الدوام: ${schedule.scheduleType}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #C49632; color: white;">
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">التاريخ</th>
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">اليوم</th>
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">الفترة الأولى</th>
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">الفترة الثانية</th>
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">ساعات العمل</th>
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">ساعات التأخير</th>
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">الحالة</th>
              <th style="border: 1px solid #00627F; padding: 8px; text-align: center;">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${monthDays.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayAttendance = monthAttendance.find(a => {
                const attendanceDate = typeof a.date === 'string' ? a.date.split('T')[0] : format(new Date(a.date), 'yyyy-MM-dd');
                return attendanceDate === dateStr;
              });
              const dayName = format(day, "EEEE", { locale: ar });
              const isHoliday = dayAttendance?.notes === 'إجازة';
              const approvedLeave = getApprovedLeaveForDay(schedule.employeeId, day);
              
              console.log('Report day debug:', { 
                dateStr, 
                dayAttendance: dayAttendance ? {
                  id: dayAttendance.id,
                  checkin: dayAttendance.continuousCheckinTime,
                  checkout: dayAttendance.continuousCheckoutTime,
                  notes: dayAttendance.notes
                } : null
              });
              
              let checkinTime = '-';
              let checkoutTime = '-';
              let workHours = '0.00';
              let delayHours = '0.00';
              let status = 'غائب';
              
              if (isHoliday) {
                status = 'إجازة';
              } else if (approvedLeave) {
                // حساب ساعات العمل الفعلية وساعات الإذن بناءً على نوع الطلب
                const expectedHours = calculateExpectedHours(schedule, day);
                let actualWorkHours = 0;
                let permissionHours = 0;
                
                if (dayAttendance) {
                  actualWorkHours = parseFloat(calculateHoursWorked(schedule, dayAttendance, day));
                }
                
                switch (approvedLeave.requestType) {
                  case 'استئذان': 
                    permissionHours = parseFloat(String(approvedLeave.duration)) || 0;
                    if (approvedLeave.durationType === 'دقيقة') permissionHours = permissionHours / 60;
                    status = `ساعات العمل: ${actualWorkHours.toFixed(2)} | استئذان: ${permissionHours.toFixed(2)}`;
                    workHours = actualWorkHours.toFixed(2);
                    break;
                  case 'إجازة': 
                    status = 'إجازة معتمدة'; 
                    workHours = '0.00';
                    break;
                  case 'تأخير في الحضور': 
                    permissionHours = parseFloat(String(approvedLeave.duration)) || 0;
                    if (approvedLeave.durationType === 'دقيقة') permissionHours = permissionHours / 60;
                    status = `ساعات العمل: ${actualWorkHours.toFixed(2)} | إحصاء التاخير: ${permissionHours.toFixed(2)}`;
                    workHours = actualWorkHours.toFixed(2);
                    break;
                  case 'انصراف مبكر': 
                    permissionHours = parseFloat(String(approvedLeave.duration)) || 0;
                    if (approvedLeave.durationType === 'دقيقة') permissionHours = permissionHours / 60;
                    status = `ساعات العمل: ${actualWorkHours.toFixed(2)} | استئذان: ${permissionHours.toFixed(2)}`;
                    workHours = actualWorkHours.toFixed(2);
                    break;
                  default: 
                    status = 'إجازة معتمدة'; 
                    workHours = '0.00';
                    break;
                }
              } else if (dayAttendance) {
                // التحقق من يوم الجمعة
                const isFriday = format(day, "EEEE", { locale: ar }) === "الجمعة";
                
                if (schedule.scheduleType === "متصل" || isFriday) {
                  // للدوام المتصل أو يوم الجمعة، عرض في الفترة الأولى فقط
                  if (isFriday) {
                    // يوم الجمعة: استخدم الفترة المسائية كفترة واحدة
                    const eveningIn = dayAttendance.eveningCheckinTime;
                    const eveningOut = dayAttendance.eveningCheckoutTime;
                    checkinTime = (eveningIn && eveningOut) ? 
                      (eveningIn === eveningOut ? '-' : `${eveningIn} - ${eveningOut}`) : '-';
                  } else {
                    // الدوام المتصل العادي
                    const continuousIn = dayAttendance.continuousCheckinTime;
                    const continuousOut = dayAttendance.continuousCheckoutTime;
                    checkinTime = (continuousIn && continuousOut) ? 
                      (continuousIn === continuousOut ? '-' : `${continuousIn} - ${continuousOut}`) : '-';
                  }
                  checkoutTime = '-';
                } else {
                  // للدوام المنفصل، عرض الفترتين منفصلتين
                  const morningIn = dayAttendance.morningCheckinTime;
                  const morningOut = dayAttendance.morningCheckoutTime;
                  const eveningIn = dayAttendance.eveningCheckinTime;
                  const eveningOut = dayAttendance.eveningCheckoutTime;
                  
                  // عرض الفترة الأولى (الصباحية)
                  checkinTime = (morningIn && morningOut) ? 
                    (morningIn === morningOut ? '-' : `${morningIn} - ${morningOut}`) : '-';
                  
                  // عرض الفترة الثانية (المسائية)
                  checkoutTime = (eveningIn && eveningOut) ? 
                    (eveningIn === eveningOut ? '-' : `${eveningIn} - ${eveningOut}`) : '-';
                }
                const calculatedHours = parseFloat(calculateHoursWorked(schedule, dayAttendance, day));
                const calculatedDelay = calculateDelayHours(schedule, dayAttendance, day);
                
                workHours = formatHoursToHoursMinutes(calculatedHours);
                delayHours = formatHoursToHoursMinutes(calculatedDelay);
                status = 'حاضر';
                
                console.log('Report work hours calculated:', {
                  date: dateStr,
                  workHours,
                  checkin: dayAttendance.continuousCheckinTime,
                  checkout: dayAttendance.continuousCheckoutTime
                });
              }
              
              return `
                <tr style="background-color: ${status === 'حاضر' ? '#f0f8ff' : status === 'إجازة' ? '#fff8dc' : '#ffffff'};">
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center;">${format(day, "dd/MM/yyyy", { locale: ar })}</td>
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center;">${dayName}</td>
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center;">${checkinTime}</td>
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center;">${checkoutTime}</td>
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center;">${workHours}</td>
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center; font-weight: bold; color: ${parseFloat(delayHours) > 0 ? '#C49632' : '#00627F'};">${delayHours}</td>
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center; font-weight: bold;
                    color: ${status === 'حاضر' ? '#00627F' : 
                             status === 'إجازة' ? '#C49632' : 
                             status === 'إجازة معتمدة' ? '#00627F' : 
                             status.includes('استئذان') ? '#C49632' : 
                             status.includes('تأخير') ? '#C49632' : 
                             status.includes('انصراف مبكر') ? '#C49632' : 
                             '#ef4444'};">
                    ${status}
                  </td>
                  <td style="border: 1px solid #00627F; padding: 6px; text-align: center; font-size: 12px; color: #333;">${dayAttendance?.notes && dayAttendance.notes !== 'إجازة' ? dayAttendance.notes : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border: 2px solid #00627F; border-radius: 8px;">
          <h3 style="color: #00627F; margin-bottom: 10px;">ملخص الشهر:</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div style="color: #00627F;">
              <strong>إجمالي أيام العمل:</strong> ${monthDays.length} يوم
            </div>
            <div style="color: #00627F;">
              <strong>أيام الحضور:</strong> ${monthAttendance.filter(a => a.notes !== 'إجازة').length} يوم
            </div>
            <div style="color: #C49632;">
              <strong>أيام الإجازة:</strong> ${monthAttendance.filter(a => a.notes === 'إجازة').length} يوم
            </div>
            <div style="color: #ef4444;">
              <strong>أيام الغياب:</strong> ${monthDays.length - monthAttendance.length} يوم
            </div>
            <div style="color: #00627F;">
              <strong>إجمالي ساعات العمل:</strong> ${formatHoursToHoursMinutes(
                monthAttendance
                  .filter(a => a.notes !== 'إجازة')
                  .reduce((total, a) => total + parseFloat(calculateHoursWorked(schedule, a)), 0)
              )}
            </div>
            <div style="color: #C49632;">
              <strong>إجمالي ساعات التأخير:</strong> ${formatHoursToHoursMinutes(
                monthAttendance
                  .filter(a => a.notes !== 'إجازة')
                  .reduce((total, a) => {
                    const dayDate = new Date(a.date);
                    const delayHours = calculateDelayHours(schedule, a, dayDate);
                    
                    // حساب الساعات الإضافية لخصمها من التأخير
                    const actualWorkHours = parseFloat(calculateHoursWorked(schedule, a, dayDate));
                    const isFriday = format(dayDate, "EEEE", { locale: ar }) === "الجمعة";
                    const requiredHours = isFriday ? 5 : 8.5;
                    const overtimeHours = Math.max(0, actualWorkHours - requiredHours);
                    
                    // خصم الساعات الإضافية من ساعات التأخير
                    const netDelayHours = Math.max(0, delayHours - overtimeHours);
                    
                    return total + netDelayHours;
                  }, 0)
              )}
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #fff8dc; border: 2px solid #C49632; border-radius: 8px;">
            <h4 style="color: #C49632; margin-bottom: 15px; font-size: 18px;">سياسة الخصم والتأخير:</h4>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 2px solid #C49632;">
              <ol style="margin: 0; padding-right: 20px; color: #333; line-height: 1.8;">
                <li style="margin-bottom: 10px;">في حالة الحضور متأخراً عن مواعيد العمل الرسمية أو الانصراف قبل الوقت المحدد، يتم تطبيق خصم يعادل ثلاثة أضعاف الفترة المتأخرة أو المبكرة.</li>
                <li style="margin-bottom: 10px;">في حال تم تسجيل بصمة الحضور دون بصمة الانصراف أو العكس، يُحتسب ذلك اليوم أو تلك الفترة غياباً كاملاً.</li>
              </ol>
            </div>
          </div>

        </div>
        
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #00627F; border-top: 1px solid #C49632; padding-top: 10px;">
          <p>تم إنشاء التقرير في: ${new Date().toLocaleString('ar-SA')}</p>
        </div>
      </div>
    `;
    
    // فتح نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>تقرير الحضور - ${schedule.employeeName} - ${monthName}</title>
            <meta charset="utf-8">
            <style>
              @media print {
                body { margin: 0; }
                @page { size: A4; margin: 1cm; }
              }
            </style>
          </head>
          <body>
            ${reportContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <GlassBackground>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">إدارة الحضور والإنصراف والإستئذان</h1>
          <p className="text-gray-300">إدارة شاملة لحضور الموظفين وطلبات الإجازة والاستئذان</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass-container backdrop-blur-md bg-white/10 border border-white/20">
            <TabsTrigger 
              value="pending-requests" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-pending-requests"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              طلبات الإجازة المعلقة ({pendingLeaveRequests.length})
            </TabsTrigger>
            <TabsTrigger 
              value="work-schedules" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-work-schedules"
            >
              <Settings className="w-4 h-4 mr-2" />
              إدارة جداول العمل
            </TabsTrigger>
            <TabsTrigger 
              value="daily-attendance" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-daily-attendance"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              الحضور اليومي
            </TabsTrigger>
            <TabsTrigger 
              value="approved-requests" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-gray-300"
              data-testid="tab-approved-requests"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              الطلبات المعتمدة ({approvedLeaveRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Leave Requests Tab */}
          <TabsContent value="pending-requests" className="mt-6">
            <GlassContainer className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">طلبات الإجازة والاستئذان المعلقة</h2>
                <div className="flex gap-3 items-center">
                  <Dialog open={isCreateRequestDialogOpen} onOpenChange={setIsCreateRequestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white" data-testid="create-request-button">
                        <Plus className="w-4 h-4 mr-2" />
                        إنشاء طلب جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      className="glass-container backdrop-blur-md bg-slate-900/90 border border-white/20 text-white max-w-md"
                      aria-describedby="request-dialog-description"
                    >
                      <DialogHeader>
                        <DialogTitle>إنشاء طلب إجازة/استئذان جديد</DialogTitle>
                      </DialogHeader>
                      
                      <div id="request-dialog-description" className="sr-only">
                        إنشاء طلب جديد للإجازة أو الاستئذان مع تحديد النوع والتاريخ والمدة والسبب
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>نوع الطلب</Label>
                          <Select value={requestType} onValueChange={setRequestType}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="استئذان">استئذان</SelectItem>
                              <SelectItem value="إجازة">إجازة</SelectItem>
                              <SelectItem value="تأخير في الحضور">تأخير في الحضور</SelectItem>
                              <SelectItem value="انصراف مبكر">انصراف مبكر</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>التاريخ</Label>
                          <Input
                            type="date"
                            value={requestDate}
                            onChange={(e) => setRequestDate(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        
                        <div>
                          <Label>المدة</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              placeholder="المدة"
                              className="bg-white/10 border-white/20 text-white flex-1"
                            />
                            {requestType !== "إجازة" && (
                              <Select value={durationType} onValueChange={setDurationType}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ساعة">ساعة</SelectItem>
                                  <SelectItem value="دقيقة">دقيقة</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label>السبب</Label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="اكتب سبب الطلب..."
                            className="w-full p-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md resize-none"
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleCreateRequest}
                            disabled={createLeaveRequestMutation.isPending || !duration || !reason}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid="submit-request-button"
                          >
                            إرسال الطلب
                          </Button>
                          <Button
                            onClick={() => setIsCreateRequestDialogOpen(false)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                    {pendingLeaveRequests.length} طلب معلق
                  </Badge>
                </div>
              </div>

              {pendingLeaveRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">لا توجد طلبات معلقة</p>
                  <p className="text-gray-400">جميع طلبات الإجازة والاستئذان تم التعامل معها</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingLeaveRequests.map((request) => (
                    <GlassCard key={request.id} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-white text-lg">{request.userName}</h3>
                          <p className="text-gray-300">{request.requestType}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="border-yellow-400 text-yellow-300 bg-yellow-400/10"
                        >
                          معلق
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-300 text-sm">تاريخ البداية</Label>
                          <p className="text-white">{format(new Date(request.startDate), "dd/MM/yyyy", { locale: ar })}</p>
                        </div>
                        {request.endDate && (
                          <div>
                            <Label className="text-gray-300 text-sm">تاريخ النهاية</Label>
                            <p className="text-white">{format(new Date(request.endDate), "dd/MM/yyyy", { locale: ar })}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-gray-300 text-sm">المدة</Label>
                          <p className="text-white">{request.duration} {request.durationType}</p>
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">طلب بواسطة</Label>
                          <p className="text-white">{request.requestedByName}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <Label className="text-gray-300 text-sm">السبب</Label>
                        <p className="text-white bg-white/5 rounded p-2 mt-1">{request.reason}</p>
                      </div>
                      
                      {canApproveRequests && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={updateRequestStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid={`approve-request-${request.id}`}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            موافقة
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={updateRequestStatusMutation.isPending}
                            variant="destructive"
                            data-testid={`reject-request-${request.id}`}
                          >
                            <X className="w-4 h-4 mr-2" />
                            رفض
                          </Button>
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>
              )}
            </GlassContainer>
          </TabsContent>

          {/* Work Schedules Tab */}
          <TabsContent value="work-schedules" className="mt-6">
            <GlassContainer className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">إدارة جداول العمل</h2>
                {canManageSchedules && (
                  <Dialog open={isCreateScheduleDialogOpen} onOpenChange={setIsCreateScheduleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="create-schedule-button">
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة جدول عمل
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      className="glass-container backdrop-blur-md bg-slate-900/90 border border-white/20 text-white max-w-md"
                      aria-describedby="schedule-dialog-description"
                    >
                      <DialogHeader>
                        <DialogTitle>إنشاء جدول عمل جديد</DialogTitle>
                      </DialogHeader>
                      
                      <div id="schedule-dialog-description" className="sr-only">
                        إنشاء جدول عمل جديد للموظف مع تحديد نوع الدوام والأوقات المطلوبة
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>الموظف</Label>
                          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="اختر الموظف" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name} - {user.jobTitle}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>راتب الموظف</Label>
                          <Input
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            placeholder="الراتب بالريال السعودي"
                            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                          />
                        </div>

                        <div>
                          <Label>نوع الدوام</Label>
                          <Select value={scheduleType} onValueChange={setScheduleType}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="متصل">دوام متصل</SelectItem>
                              <SelectItem value="منفصل">دوام منفصل</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {scheduleType === "متصل" ? (
                          <>
                            <div>
                              <Label>وقت الحضور</Label>
                              <Input
                                type="time"
                                value={continuousStartTime}
                                onChange={(e) => setContinuousStartTime(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                              />
                            </div>
                            <div>
                              <Label>وقت الانصراف</Label>
                              <Input
                                type="time"
                                value={continuousEndTime}
                                onChange={(e) => setContinuousEndTime(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>الفترة الصباحية - بداية</Label>
                                <Input
                                  type="time"
                                  value={morningStartTime}
                                  onChange={(e) => setMorningStartTime(e.target.value)}
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </div>
                              <div>
                                <Label>الفترة الصباحية - نهاية</Label>
                                <Input
                                  type="time"
                                  value={morningEndTime}
                                  onChange={(e) => setMorningEndTime(e.target.value)}
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>الفترة المسائية - بداية</Label>
                                <Input
                                  type="time"
                                  value={eveningStartTime}
                                  onChange={(e) => setEveningStartTime(e.target.value)}
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </div>
                              <div>
                                <Label>الفترة المسائية - نهاية</Label>
                                <Input
                                  type="time"
                                  value={eveningEndTime}
                                  onChange={(e) => setEveningEndTime(e.target.value)}
                                  className="bg-white/10 border-white/20 text-white"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleCreateSchedule}
                            disabled={createScheduleMutation.isPending || !selectedEmployeeId || !salary}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            data-testid="save-schedule-button"
                          >
                            حفظ الجدول
                          </Button>
                          <Button
                            onClick={() => setIsCreateScheduleDialogOpen(false)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="mb-4">
                <Input
                  placeholder="البحث عن موظف..."
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  data-testid="employee-filter-input"
                />
              </div>

              <div className="grid gap-4">
                {filteredSchedules.map((schedule) => (
                  <GlassCard key={schedule.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{schedule.employeeName}</h3>
                        <p className="text-gray-300">الراتب: {parseFloat(schedule.salary).toLocaleString()} ريال</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={schedule.scheduleType === "متصل" 
                          ? "border-blue-400 text-blue-300 bg-blue-400/10"
                          : "border-green-400 text-green-300 bg-green-400/10"
                        }
                      >
                        {schedule.scheduleType}
                      </Badge>
                    </div>
                    
                    {schedule.scheduleType === "متصل" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 text-sm">وقت الحضور</Label>
                          <p className="text-white">{schedule.continuousStartTime}</p>
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">وقت الانصراف</Label>
                          <p className="text-white">{schedule.continuousEndTime}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 text-sm">الفترة الصباحية</Label>
                          <p className="text-white">{schedule.morningStartTime} - {schedule.morningEndTime}</p>
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">الفترة المسائية</Label>
                          <p className="text-white">{schedule.eveningStartTime} - {schedule.eveningEndTime}</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {canManageSchedules && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                        <Button
                          onClick={() => handleEditSchedule(schedule)}
                          size="sm"
                          variant="outline"
                          className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          data-testid={`edit-schedule-${schedule.id}`}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          تعديل
                        </Button>
                        <Button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          size="sm"
                          variant="outline"
                          className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                          data-testid={`delete-schedule-${schedule.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف
                        </Button>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>

              {filteredSchedules.length === 0 && (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">لا توجد جداول عمل</p>
                  <p className="text-gray-400">لم يتم إنشاء أي جداول عمل للموظفين بعد</p>
                </div>
              )}
            </GlassContainer>
          </TabsContent>

          {/* Daily Attendance Tab */}
          <TabsContent value="daily-attendance" className="mt-6">
            <GlassContainer className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">الحضور اليومي</h2>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={exportAttendanceToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={dailyAttendance.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    تصدير إلى إكسل
                  </Button>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                    {dailyAttendance.length} سجل حضور
                  </Badge>
                  <Button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="text-center">
                    <p className="text-white font-semibold">
                      {format(currentMonth, "MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                  <Button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Employee List */}
              <div className="grid gap-4 mb-6">
                {workSchedules.map((schedule) => {
                  const isExpanded = selectedEmployeeForAttendance === schedule.employeeId;
                  const monthAttendance = getEmployeeMonthAttendance(schedule.employeeId);
                  const monthDays = getMonthDays();
                  
                  return (
                    <GlassCard key={schedule.id} className="p-4">
                      <div 
                        className="flex justify-between items-center"
                      >
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => handleEmployeeClick(schedule)}
                        >
                          <UserCheck className="w-5 h-5 text-blue-400" />
                          <div>
                            <h3 className="font-semibold text-white text-lg">{schedule.employeeName}</h3>
                            <p className="text-gray-300 text-sm">{schedule.scheduleType} • {schedule.salary} ريال</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className="border-blue-400 text-blue-300 bg-blue-400/10"
                          >
                            {monthAttendance.length} يوم حضور هذا الشهر
                          </Badge>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintMonthlyReport(schedule);
                            }}
                            size="sm"
                            variant="outline"
                            className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            طباعة التقرير
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEmployeeCollapse(schedule.employeeId);
                            }}
                            size="sm"
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors"
                          >
                            {collapsedEmployees.has(schedule.employeeId) ? (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                إظهار
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                إخفاء
                              </>
                            )}
                          </Button>
                          <ChevronLeft 
                            className={`w-5 h-5 text-gray-300 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                        </div>
                      </div>

                      {/* Calendar View when expanded and not collapsed */}
                      {isExpanded && !collapsedEmployees.has(schedule.employeeId) && (
                        <div className="mt-6 space-y-4">
                          {/* Bar-style Calendar */}
                          <div className="bg-white/5 rounded-lg p-6 space-y-3">
                            {/* Calendar Days as Progress Bars */}
                            {monthDays.map((day) => {
                              const dayStr = format(day, "yyyy-MM-dd");
                              const dayAttendance = monthAttendance.find(a => {
                                const attendanceDate = typeof a.date === 'string' ? a.date : format(new Date(a.date), 'yyyy-MM-dd');
                                const normalizedAttendanceDate = attendanceDate.split('T')[0]; // Remove time part if present
                                return normalizedAttendanceDate === dayStr;
                              });
                              const isToday = isSameDay(day, new Date());
                              const hasAttendance = !!dayAttendance;
                              const isHoliday = dayAttendance?.notes === 'إجازة';
                              const hasApprovedLeaveForDay = hasApprovedLeave(schedule.employeeId, day);
                              const isLate = hasAttendance && !isHoliday && !hasApprovedLeaveForDay && isEmployeeLate(schedule, day);
                              
                              // Calculate hours worked and percentage with special handling for approved leave
                              const hoursWorked = hasAttendance && !isHoliday ? parseFloat(calculateHoursWorked(schedule, dayAttendance, day)) : 0;
                              const expectedHours = calculateExpectedHours(schedule, day);
                              const approvedLeave = getApprovedLeaveForDay(schedule.employeeId, day);
                              
                              // Debug logging for progress bar calculation
                              console.log(`Progress bar debug for ${format(day, 'yyyy-MM-dd')}:`, {
                                hasAttendance,
                                isHoliday,
                                hoursWorked,
                                expectedHours,
                                dayAttendance,
                                scheduleType: schedule.scheduleType
                              });
                              
                              // Calculate work percentage properly for approved leave requests
                              let workPercentage = 0;
                              
                              if (isHoliday) {
                                workPercentage = 100;
                              } else if (approvedLeave) {
                                // Handle different types of approved leave
                                const leaveHours = parseFloat(String(approvedLeave.duration)) || 0;
                                
                                if (approvedLeave.requestType === "انصراف مبكر") {
                                  // For early departure: calculate based on actual work vs adjusted expected
                                  const actualWorkHours = hasAttendance ? hoursWorked : 0;
                                  const effectiveWorkHours = Math.max(0, expectedHours - leaveHours);
                                  
                                  if (effectiveWorkHours === 0 || actualWorkHours >= effectiveWorkHours) {
                                    workPercentage = 100;
                                  } else {
                                    workPercentage = Math.min(100, (actualWorkHours / effectiveWorkHours) * 100);
                                  }
                                } else if (approvedLeave.requestType === "تأخير") {
                                  // For late arrival: similar logic
                                  const adjustedExpectedHours = Math.max(0, expectedHours - leaveHours);
                                  
                                  if (hasAttendance && adjustedExpectedHours > 0) {
                                    workPercentage = Math.min(100, (hoursWorked / adjustedExpectedHours) * 100);
                                  } else {
                                    workPercentage = 100;
                                  }
                                } else if (approvedLeave.requestType === "استئذان") {
                                  // For permission: calculate based on remaining work hours
                                  const remainingExpectedHours = Math.max(0, expectedHours - leaveHours);
                                  
                                  if (remainingExpectedHours === 0) {
                                    workPercentage = 100;
                                  } else if (hasAttendance) {
                                    workPercentage = Math.min(100, (hoursWorked / remainingExpectedHours) * 100);
                                  }
                                } else {
                                  // Full day leave types
                                  workPercentage = 100;
                                }
                              } else if (hasAttendance && expectedHours > 0) {
                                // Regular attendance without approved leave
                                workPercentage = Math.min(100, (hoursWorked / expectedHours) * 100);
                              } else if (isToday) {
                                // Current day with no attendance record - don't mark as absent
                                workPercentage = 50; // Show as in progress instead of absent
                              } else {
                                // Past days with no attendance record and no approved leave
                                workPercentage = 0;
                              }
                              
                              // Debug the final work percentage
                              console.log(`Final work percentage for ${format(day, 'yyyy-MM-dd')}:`, workPercentage);
                              
                              // Get day name in Arabic
                              const dayName = format(day, "EEEE", { locale: ar });
                              
                              return (
                                <div
                                  key={day.toISOString()}
                                  className={`
                                    group cursor-pointer transition-all duration-300 hover:scale-[1.02]
                                    ${isToday ? 'ring-2 ring-blue-400 rounded-lg p-1' : ''}
                                  `}
                                  onClick={() => handleDayClick(day, schedule)}
                                >
                                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10">
                                    {/* Date Info */}
                                    <div className="flex flex-col items-center min-w-[80px]">
                                      <div className={`text-2xl font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                                        {format(day, "d")}
                                      </div>
                                      <div className="text-xs text-gray-400 truncate">
                                        {dayName}
                                      </div>
                                    </div>
                                    
                                    {/* Progress Bar Container */}
                                    <div className="flex-1 space-y-1">
                                      <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-300">
                                          {(() => {
                                            if (isHoliday) return 'إجازة';
                                            const approvedLeave = getApprovedLeaveForDay(schedule.employeeId, day);
                                            if (approvedLeave) {
                                              switch (approvedLeave.requestType) {
                                                case 'استئذان': return `استئذان (${approvedLeave.duration} ${approvedLeave.durationType})`;
                                                case 'إجازة': return 'إجازة معتمدة';
                                                case 'تأخير في الحضور': return `تأخير (${approvedLeave.duration} ${approvedLeave.durationType})`;
                                                case 'انصراف مبكر': return `انصراف مبكر (${approvedLeave.duration} ${approvedLeave.durationType})`;
                                                default: return 'إجازة معتمدة';
                                              }
                                            }
                                            return hasAttendance ? `${hoursWorked.toFixed(1)} ساعة` : 'لا يوجد سجل';
                                          })()
                                        }</div>
                                        <div className="text-xs text-gray-400">
                                          {(() => {
                                            if (isHoliday) return '';
                                            if (approvedLeave) {
                                              if (approvedLeave.requestType === 'إجازة') return '';
                                              return `${workPercentage.toFixed(0)}%`;
                                            }
                                            return hasAttendance ? `${workPercentage.toFixed(0)}%` : '';
                                          })()}
                                        </div>
                                      </div>
                                      
                                      {/* Progress Bar */}
                                      <div className="relative h-6 bg-gray-700/50 rounded-full overflow-hidden">
                                        {/* Background gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/30 to-gray-600/50"></div>
                                        
                                        {/* Progress fill */}
                                        {(() => {
                                          if (isHoliday) {
                                            return (
                                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                                                <Coffee className="w-4 h-4 text-white" />
                                              </div>
                                            );
                                          }
                                          
                                          const approvedLeave = getApprovedLeaveForDay(schedule.employeeId, day);
                                          if (approvedLeave) {
                                            // Show different colors and icons based on request type
                                            switch (approvedLeave.requestType) {
                                              case 'استئذان':
                                                return (
                                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-white" />
                                                  </div>
                                                );
                                              case 'إجازة':
                                                return (
                                                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                                                    <Coffee className="w-4 h-4 text-white" />
                                                  </div>
                                                );
                                              case 'تأخير في الحضور':
                                                return (
                                                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                                                    <AlertCircle className="w-4 h-4 text-white" />
                                                  </div>
                                                );
                                              case 'انصراف مبكر':
                                                return (
                                                  <div className="absolute inset-0 flex items-center">
                                                    <div 
                                                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center transition-all duration-500" 
                                                      style={{ width: `${Math.max(workPercentage, 10)}%` }}
                                                    >
                                                      <UserClock className="w-4 h-4 text-white" />
                                                    </div>
                                                  </div>
                                                );
                                              default:
                                                return (
                                                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                                                    <Coffee className="w-4 h-4 text-white" />
                                                  </div>
                                                );
                                            }
                                          }
                                          
                                          if (hasAttendance) {
                                            // Determine the appropriate color and icon based on status
                                            let bgColor = '';
                                            let icon = null;
                                            let barWidth = Math.max(workPercentage, 10);
                                            
                                            if (approvedLeave) {
                                              // Show actual percentage for approved leave that affects work
                                              switch (approvedLeave.requestType) {
                                                case 'انصراف مبكر':
                                                  // Force purple color for early departure
                                                  bgColor = 'bg-gradient-to-r from-purple-500 to-purple-600';
                                                  icon = <UserClock className="w-3 h-3 text-white" />;
                                                  barWidth = workPercentage;
                                                  break;
                                                case 'استئذان':
                                                  bgColor = 'bg-gradient-to-r from-blue-500 to-blue-600';
                                                  icon = <Clock className="w-3 h-3 text-white" />;
                                                  barWidth = workPercentage;
                                                  break;
                                                case 'تأخير في الحضور':
                                                  bgColor = 'bg-gradient-to-r from-orange-500 to-red-500';
                                                  icon = <AlertCircle className="w-3 h-3 text-white" />;
                                                  barWidth = workPercentage;
                                                  break;
                                                default:
                                                  bgColor = 'bg-gradient-to-r from-green-500 to-green-600';
                                                  icon = <Coffee className="w-3 h-3 text-white" />;
                                                  barWidth = 100;
                                                  break;
                                              }
                                            } else if (workPercentage >= 100) {
                                              // الأولوية للعمل المكتمل - حتى لو كان هناك تأخير
                                              bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
                                              icon = <CheckCircle className="w-3 h-3 text-white" />;
                                            } else if (isLate && workPercentage < 90) {
                                              // إظهار التأخير فقط عندما تكون ساعات العمل أقل من 90%
                                              bgColor = 'bg-gradient-to-r from-red-500 to-red-600';
                                              icon = <XCircle className="w-3 h-3 text-white" />;
                                            } else if (workPercentage >= 75) {
                                              bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
                                              icon = <Clock className="w-3 h-3 text-white" />;
                                            } else if (workPercentage >= 50) {
                                              bgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
                                              icon = <Clock className="w-3 h-3 text-white" />;
                                            } else if (workPercentage > 0) {
                                              bgColor = 'bg-gradient-to-r from-orange-500 to-red-500';
                                              icon = <Clock className="w-3 h-3 text-white" />;
                                            }
                                            
                                            return (
                                              <div 
                                                className={`h-full transition-all duration-500 flex items-center justify-center ${bgColor}`}
                                                style={{ width: `${Math.max(barWidth, 10)}%` }}
                                              >
                                                {icon}
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="h-full bg-gradient-to-r from-gray-600/20 to-gray-600/30 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full opacity-50"></div>
                                              </div>
                                            );
                                          }
                                        })()}
                                        
                                        {/* Glow effect for today */}
                                        {isToday && (
                                          <div className="absolute inset-0 bg-blue-400/20 animate-pulse"></div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Status Icon and Edit Button */}
                                    <div className="min-w-[80px] flex items-center gap-2">
                                      <div className="flex justify-center">
                                        {isHoliday || hasApprovedLeaveForDay ? (
                                          <Coffee className="w-5 h-5 text-yellow-400" />
                                        ) : hasAttendance ? (
                                          workPercentage >= 100 ? (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                          ) : isLate && workPercentage < 90 ? (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                          ) : (
                                            <Clock className="w-5 h-5 text-blue-400" />
                                          )
                                        ) : (
                                          <div className="w-5 h-5 border-2 border-gray-500 rounded-full opacity-30"></div>
                                        )}
                                      </div>
                                      {canManageAttendance && (
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditDay(schedule, day, dayAttendance);
                                          }}
                                          size="sm"
                                          variant="outline"
                                          className="w-8 h-8 p-0 bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors opacity-60 hover:opacity-100"
                                          data-testid={`edit-day-${format(day, 'yyyy-MM-dd')}`}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Enhanced Legend */}
                          <div className="bg-white/5 rounded-lg p-4 mt-4">
                            <h4 className="text-white font-semibold mb-3 text-center">دليل الألوان والحالات</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                                <span className="text-green-200 font-medium">100%+ (مكتمل)</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                                <span className="text-red-200 font-medium">تأخير مع عمل أقل من 90%</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                                <span className="text-purple-200 font-medium">انصراف مبكر</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                                <span className="text-blue-200 font-medium">استئذان</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                  <Coffee className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-yellow-200 font-medium">إجازة</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 bg-gray-600/30 rounded-full"></div>
                                <span className="text-gray-300 font-medium">لا يوجد سجل</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-3 border-2 border-blue-400 rounded-full bg-blue-400/20"></div>
                                <span className="text-blue-300 font-medium">اليوم الحالي</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>

              {workSchedules.length === 0 && (
                <div className="text-center py-12">
                  <UserClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">لا توجد جداول عمل</p>
                  <p className="text-gray-400">يجب إنشاء جداول عمل للموظفين أولاً لتتمكن من إدارة الحضور</p>
                </div>
              )}

              {/* Redesigned Attendance Dialog */}
              <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                <DialogContent 
                  className="glass-container backdrop-blur-md bg-slate-900/90 border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto"
                  aria-describedby="attendance-dialog-description"
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl text-center">
                      إدارة الحضور - {selectedEmployeeForDialog?.employeeName}
                    </DialogTitle>
                    <p className="text-gray-300 text-center">
                      {selectedDayForAttendance && format(selectedDayForAttendance, "EEEE، dd MMMM yyyy", { locale: ar })}
                    </p>
                  </DialogHeader>
                  
                  <div id="attendance-dialog-description" className="sr-only">
                    إدارة حضور وانصراف الموظف للتاريخ المحدد مع إمكانية تعديل الأوقات وتحديد الإجازات
                  </div>
                  
                  {selectedEmployeeForDialog && selectedDayForAttendance && (() => {
                    const dateStr = format(selectedDayForAttendance, "yyyy-MM-dd");
                    const existingAttendance = dailyAttendance.find(a => {
                      const attendanceDate = typeof a.date === 'string' ? a.date : format(new Date(a.date), 'yyyy-MM-dd');
                      const normalizedAttendanceDate = attendanceDate.split('T')[0]; // Remove time part if present
                      return a.employeeId === selectedEmployeeForDialog.employeeId && normalizedAttendanceDate === dateStr;
                    });
                    
                    // التحقق من يوم الجمعة (دوام خاص من 4:00 مساءً إلى 9:00 مساءً)
                    const isFriday = format(selectedDayForAttendance, "EEEE", { locale: ar }) === "الجمعة";
                    
                    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    
                    // Get default times - show scheduled times for new records
                    const getDefaultTime = (fieldType: string) => {
                      if (existingAttendance) {
                        // If attendance record exists, show saved time
                        return (existingAttendance as any)[fieldType] || getScheduledDefaultTime(fieldType);
                      } else {
                        // If no attendance record, show scheduled default times
                        return getScheduledDefaultTime(fieldType);
                      }
                    };

                    // Get scheduled default times based on field type
                    const getScheduledDefaultTime = (fieldType: string) => {
                      switch (fieldType) {
                        case 'continuousCheckinTime': return '12:00';   // 12:00 PM
                        case 'continuousCheckoutTime': return '22:00';  // 10:00 PM
                        case 'morningCheckinTime': return '09:30';      // 09:30 AM
                        case 'morningCheckoutTime': return '13:00';     // 01:00 PM
                        case 'eveningCheckinTime': return '16:00';      // 04:00 PM
                        case 'eveningCheckoutTime': return '21:00';     // 09:00 PM
                        default: return currentTime;
                      }
                    };

                    // Function to set current time in input fields when dialog opens
                    const setCurrentTimeToInputs = () => {
                      if (!existingAttendance) {
                        setTimeout(() => {
                          const timeInputs = ['continuous-checkin-time', 'continuous-checkout-time', 'morning-checkin-time', 'morning-checkout-time', 'evening-checkin-time', 'evening-checkout-time'];
                          timeInputs.forEach(inputId => {
                            const input = document.getElementById(inputId) as HTMLInputElement;
                            if (input) {
                              input.value = currentTime;
                            }
                          });
                        }, 100);
                      }
                    };
                    
                    return (
                      <div className="space-y-6" dir="rtl">
                        {/* Employee Info */}
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">الموظف: </span>
                              <span className="text-white font-medium">{selectedEmployeeForDialog.employeeName}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">نوع الدوام: </span>
                              <span className="text-white font-medium">{selectedEmployeeForDialog.scheduleType}</span>
                            </div>
                          </div>
                        </div>

                        {selectedEmployeeForDialog.scheduleType === "متصل" ? (
                          /* Continuous Schedule - 2 Fields */
                          <div className="bg-white/5 rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-6 text-center text-blue-300">الدوام المتصل</h3>
                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300 text-center">وقت الحضور الفعلي</label>
                                <div className="flex gap-3 justify-center">
                                  <Input
                                    type="time"
                                    defaultValue={getDefaultTime('continuousCheckinTime')}
                                    className="text-2xl h-16 text-center font-mono bg-white/10 border-white/20 text-white"
                                    id="continuous-checkin-time"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                      if (existingAttendance) {
                                        handleAttendanceUpdate(existingAttendance.id, 'continuousCheckinTime', time);
                                      }
                                    }}
                                    className="h-16 px-4 border-white/20 hover:bg-white/10"
                                  >
                                    <Clock className="w-5 h-5" />
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-400 text-center">
                                  الوقت المحدد: {selectedEmployeeForDialog.continuousStartTime}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300 text-center">وقت الانصراف الفعلي</label>
                                <div className="flex gap-3 justify-center">
                                  <Input
                                    type="time"
                                    defaultValue={getDefaultTime('continuousCheckoutTime')}
                                    className="text-2xl h-16 text-center font-mono bg-white/10 border-white/20 text-white"
                                    id="continuous-checkout-time"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                      if (existingAttendance) {
                                        handleAttendanceUpdate(existingAttendance.id, 'continuousCheckoutTime', time);
                                      }
                                    }}
                                    className="h-16 px-4 border-white/20 hover:bg-white/10"
                                  >
                                    <Clock className="w-5 h-5" />
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-400 text-center">
                                  الوقت المحدد: {selectedEmployeeForDialog.continuousEndTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Split Schedule - 4 Fields */
                          <div className="space-y-6">
                            <h3 className="font-semibold text-lg text-center text-blue-300">
                              {isFriday ? "دوام الجمعة (4:00 مساءً - 9:00 مساءً)" : "الدوام المنفصل"}
                            </h3>
                            
                            {/* Morning Period - إخفاء في يوم الجمعة */}
                            {!isFriday && (
                              <div className="bg-white/5 rounded-lg p-6">
                                <h4 className="font-medium mb-4 text-center text-orange-400">الفترة الصباحية</h4>
                                <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-300 text-center">وقت الحضور الصباحي</label>
                                    <div className="flex gap-3 justify-center">
                                      <Input
                                        type="time"
                                        defaultValue={getDefaultTime('morningCheckinTime')}
                                        className="text-lg h-12 text-center font-mono bg-white/10 border-white/20 text-white"
                                        id="morning-checkin-time"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                          if (existingAttendance) {
                                            handleAttendanceUpdate(existingAttendance.id, 'morningCheckinTime', time);
                                          }
                                        }}
                                        className="h-12 px-3 border-white/20 hover:bg-white/10"
                                      >
                                        <Clock className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <div className="text-xs text-gray-400 text-center">
                                      الوقت المحدد: {selectedEmployeeForDialog.morningStartTime}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-300 text-center">وقت الانصراف الصباحي</label>
                                    <div className="flex gap-3 justify-center">
                                      <Input
                                        type="time"
                                        defaultValue={getDefaultTime('morningCheckoutTime')}
                                        className="text-lg h-12 text-center font-mono bg-white/10 border-white/20 text-white"
                                        id="morning-checkout-time"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                          if (existingAttendance) {
                                            handleAttendanceUpdate(existingAttendance.id, 'morningCheckoutTime', time);
                                          }
                                        }}
                                        className="h-12 px-3 border-white/20 hover:bg-white/10"
                                      >
                                        <Clock className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <div className="text-xs text-gray-400 text-center">
                                      الوقت المحدد: {selectedEmployeeForDialog.morningEndTime}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Evening Period */}
                            <div className="bg-white/5 rounded-lg p-6">
                              <h4 className="font-medium mb-4 text-center text-purple-400">
                                {isFriday ? "دوام الجمعة" : "الفترة المسائية"}
                              </h4>
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                  <label className="block text-sm font-medium text-gray-300 text-center">
                                    {isFriday ? "وقت الحضور" : "وقت الحضور المسائي"}
                                  </label>
                                  <div className="flex gap-3 justify-center">
                                    <Input
                                      type="time"
                                      defaultValue={getDefaultTime('eveningCheckinTime')}
                                      className="text-lg h-12 text-center font-mono bg-white/10 border-white/20 text-white"
                                      id="evening-checkin-time"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                        if (existingAttendance) {
                                          handleAttendanceUpdate(existingAttendance.id, 'eveningCheckinTime', time);
                                        }
                                      }}
                                      className="h-12 px-3 border-white/20 hover:bg-white/10"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="text-xs text-gray-400 text-center">
                                    الوقت المحدد: {selectedEmployeeForDialog.eveningStartTime}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <label className="block text-sm font-medium text-gray-300 text-center">
                                    {isFriday ? "وقت الانصراف" : "وقت الانصراف المسائي"}
                                  </label>
                                  <div className="flex gap-3 justify-center">
                                    <Input
                                      type="time"
                                      defaultValue={getDefaultTime('eveningCheckoutTime')}
                                      className="text-lg h-12 text-center font-mono bg-white/10 border-white/20 text-white"
                                      id="evening-checkout-time"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                                        if (existingAttendance) {
                                          handleAttendanceUpdate(existingAttendance.id, 'eveningCheckoutTime', time);
                                        }
                                      }}
                                      className="h-12 px-3 border-white/20 hover:bg-white/10"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="text-xs text-gray-400 text-center">
                                    الوقت المحدد: {selectedEmployeeForDialog.eveningEndTime}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes Section */}
                        <div className="bg-white/5 rounded-lg p-6">
                          <label className="block text-sm font-medium text-gray-300 mb-3 text-center">الملاحظات</label>
                          <Textarea
                            defaultValue={existingAttendance?.notes && existingAttendance.notes !== 'إجازة' ? existingAttendance.notes : ''}
                            className="w-full bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[80px]"
                            placeholder="اكتب أي ملاحظات حول الحضور والانصراف..."
                            id="attendance-notes"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-4 pt-6 border-t border-white/10">
                          <Button
                            onClick={handleMarkHoliday}
                            variant="outline"
                            className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border-yellow-400/50 px-8"
                            disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending || markHolidayMutation.isPending}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            {existingAttendance?.notes === 'إجازة' ? 'إلغاء الإجازة' : 'تحديد كإجازة'}
                          </Button>
                          
                          {/* زر دوام إضافة ليوم الجمعة فقط */}
                          {isFriday && (
                            <Button
                              onClick={() => {
                                // تبديل حالة دوام إضافة
                                const isOvertimeShift = existingAttendance?.notes === 'دوام إضافة';
                                const newNotes = isOvertimeShift ? '' : 'دوام إضافة';
                                
                                if (!existingAttendance) {
                                  // إنشاء سجل حضور جديد مع دوام إضافة
                                  const attendanceData = {
                                    employeeId: selectedEmployeeForDialog.employeeId,
                                    employeeName: selectedEmployeeForDialog.employeeName,
                                    date: dateStr,
                                    scheduleType: selectedEmployeeForDialog.scheduleType,
                                    notes: newNotes,
                                    eveningCheckinTime: '16:00',
                                    eveningCheckoutTime: '21:00'
                                  };
                                  createAttendanceMutation.mutate(attendanceData);
                                } else {
                                  // تحديث السجل الموجود
                                  const updateData = {
                                    ...existingAttendance,
                                    notes: newNotes
                                  };
                                  updateAttendanceMutation.mutate({ attendanceId: existingAttendance.id, updateData });
                                }
                              }}
                              variant="outline"
                              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-400/50 px-8"
                              disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending || markHolidayMutation.isPending}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {existingAttendance?.notes === 'دوام إضافة' ? 'إلغاء دوام إضافة' : 'دوام إضافة'}
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => {
                              // Get values from time inputs
                              const getInputValue = (id: string) => {
                                const input = document.getElementById(id) as HTMLInputElement;
                                return input?.value || currentTime;
                              };

                              // Get notes value
                              const notesTextarea = document.getElementById('attendance-notes') as HTMLTextAreaElement;
                              const notes = notesTextarea?.value || '';

                              if (!existingAttendance) {
                                // Create new attendance record with values from time inputs
                                const attendanceData = {
                                  employeeId: selectedEmployeeForDialog.employeeId,
                                  employeeName: selectedEmployeeForDialog.employeeName,
                                  date: dateStr,
                                  scheduleType: selectedEmployeeForDialog.scheduleType,
                                  notes: notes,
                                  ...(selectedEmployeeForDialog.scheduleType === "متصل" 
                                    ? {
                                        continuousCheckinTime: getInputValue('continuous-checkin-time'),
                                        continuousCheckoutTime: getInputValue('continuous-checkout-time')
                                      }
                                    : {
                                        morningCheckinTime: getInputValue('morning-checkin-time'),
                                        morningCheckoutTime: getInputValue('morning-checkout-time'),
                                        eveningCheckinTime: getInputValue('evening-checkin-time'),
                                        eveningCheckoutTime: getInputValue('evening-checkout-time')
                                      }
                                  )
                                };
                                createAttendanceMutation.mutate(attendanceData);
                              } else {
                                // Update existing attendance with values from time inputs
                                if (selectedEmployeeForDialog.scheduleType === "متصل") {
                                  const checkinTime = getInputValue('continuous-checkin-time');
                                  const checkoutTime = getInputValue('continuous-checkout-time');
                                  handleAttendanceUpdate(existingAttendance.id, 'continuousCheckinTime', checkinTime);
                                  setTimeout(() => handleAttendanceUpdate(existingAttendance.id, 'continuousCheckoutTime', checkoutTime), 100);
                                  // Update notes
                                  if (notes !== (existingAttendance.notes || '')) {
                                    setTimeout(() => handleAttendanceUpdate(existingAttendance.id, 'notes', notes), 200);
                                  }
                                } else {
                                  const morningCheckin = getInputValue('morning-checkin-time');
                                  const morningCheckout = getInputValue('morning-checkout-time');
                                  const eveningCheckin = getInputValue('evening-checkin-time');
                                  const eveningCheckout = getInputValue('evening-checkout-time');
                                  
                                  handleAttendanceUpdate(existingAttendance.id, 'morningCheckinTime', morningCheckin);
                                  setTimeout(() => handleAttendanceUpdate(existingAttendance.id, 'morningCheckoutTime', morningCheckout), 100);
                                  setTimeout(() => handleAttendanceUpdate(existingAttendance.id, 'eveningCheckinTime', eveningCheckin), 200);
                                  setTimeout(() => handleAttendanceUpdate(existingAttendance.id, 'eveningCheckoutTime', eveningCheckout), 300);
                                }
                                // Update notes
                                if (notes !== (existingAttendance.notes || '')) {
                                  setTimeout(() => handleAttendanceUpdate(existingAttendance.id, 'notes', notes), 400);
                                }
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-12"
                            disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            حفظ الأوقات
                          </Button>
                          
                          <Button
                            variant="outline"
                            onClick={() => setIsAttendanceDialogOpen(false)}
                            disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
                            className="px-8 border-white/20 text-white hover:bg-white/10"
                          >
                            إغلاق
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </DialogContent>
              </Dialog>
            </GlassContainer>
          </TabsContent>

          {/* Approved Requests Tab */}
          <TabsContent value="approved-requests" className="mt-6">
            <GlassContainer className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">الطلبات المعتمدة</h2>
                <div className="flex gap-3 items-center">
                  <Button
                    onClick={() => setIsCreateRequestDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="create-request-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    إنشاء طلب جديد
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckSquare className="w-4 h-4" />
                    <span>إجمالي الطلبات المعتمدة: {approvedLeaveRequests.length}</span>
                  </div>
                </div>
              </div>

              {approvedLeaveRequests.length > 0 ? (
                <div className="space-y-4">
                  {approvedLeaveRequests.map((request) => (
                    <GlassCard key={request.id} className="p-6 transition-all duration-300 hover:bg-white/15">
                      <div className="space-y-4">
                        {/* Header with employee info and status */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                              <CheckSquare className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-white">{request.userName}</h3>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  {request.requestType}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400">رقم الطلب: #{request.id}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintRequest(request)}
                            className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            طباعة
                          </Button>
                        </div>

                        {/* Request details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="space-y-1">
                            <span className="text-gray-400">تاريخ البداية:</span>
                            <div className="text-white font-medium">
                              {new Date(request.startDate).toLocaleDateString('ar-SA', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-400">المدة:</span>
                            <div className="text-white font-medium">
                              {request.duration} {request.durationType}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-400">وافق عليه:</span>
                            <div className="text-green-400 font-medium">
                              {request.approvedByName || 'غير محدد'}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-400">تاريخ الموافقة:</span>
                            <div className="text-white font-medium">
                              {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        {request.reason && (
                          <div className="space-y-2">
                            <span className="text-gray-400 text-sm">سبب الطلب:</span>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                              <p className="text-white text-sm leading-relaxed">{request.reason}</p>
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>تم إنشاء الطلب: {new Date(request.createdAt).toLocaleString('ar-SA')}</div>
                            {request.approvedAt && (
                              <div>تمت الموافقة: {new Date(request.approvedAt).toLocaleString('ar-SA')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">لا توجد طلبات معتمدة</p>
                  <p className="text-gray-400">لم يتم العثور على أي طلبات إجازة أو استئذان معتمدة</p>
                </div>
              )}
            </GlassContainer>
          </TabsContent>

          {/* Create Request Dialog */}
          <Dialog open={isCreateRequestDialogOpen} onOpenChange={setIsCreateRequestDialogOpen}>
            <DialogContent 
              className="glass-container backdrop-blur-md bg-slate-900/90 border border-white/20 text-white max-w-md"
              aria-describedby="create-request-dialog-description"
            >
              <DialogHeader>
                <DialogTitle className="text-xl text-center">إنشاء طلب جديد</DialogTitle>
              </DialogHeader>
              
              <div id="create-request-dialog-description" className="sr-only">
                نموذج إنشاء طلب إجازة أو استئذان جديد
              </div>
              
              <div className="space-y-4" dir="rtl">
                {/* اسم المستخدم */}
                <div>
                  <Label className="text-gray-300">اسم المستخدم</Label>
                  <Input 
                    value={username} 
                    disabled 
                    className="bg-white/5 border-white/20 text-white" 
                  />
                </div>

                {/* نوع الطلب */}
                <div>
                  <Label className="text-gray-300">نوع الطلب</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="استئذان">استئذان (ساعات)</SelectItem>
                      <SelectItem value="إجازة">إجازة (أيام)</SelectItem>
                      <SelectItem value="تأخير في الحضور">تأخير في الحضور</SelectItem>
                      <SelectItem value="انصراف مبكر">انصراف مبكر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* تاريخ البداية / الوقت */}
                <div>
                  <Label className="text-gray-300">
                    {requestType === "إجازة" ? "تاريخ البداية" : "التاريخ"}
                  </Label>
                  <Select value={requestDate} onValueChange={setRequestDate}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value={format(new Date(), "yyyy-MM-dd")}>
                        اليوم - {format(new Date(), "dd/MM/yyyy", { locale: ar })}
                      </SelectItem>
                      <SelectItem value={format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd")}>
                        أمس - {format(new Date(Date.now() - 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ar })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* المدة */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-gray-300">المدة</Label>
                    <Input 
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="المدة"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">الوحدة</Label>
                    <Select 
                      value={requestType === "إجازة" ? "يوم" : durationType} 
                      onValueChange={setDurationType}
                      disabled={requestType === "إجازة"}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20">
                        {requestType === "إجازة" ? (
                          <SelectItem value="يوم">يوم</SelectItem>
                        ) : (
                          <SelectItem value="ساعة">ساعة</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* السبب */}
                <div>
                  <Label className="text-gray-300">السبب</Label>
                  <Textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-white/10 border-white/20 text-white resize-none"
                    placeholder="اكتب سبب الطلب..."
                    rows={3}
                  />
                </div>

                {/* أزرار العمل */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreateRequest}
                    disabled={createLeaveRequestMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    {createLeaveRequestMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateRequestDialogOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Tabs>

        {/* Edit Schedule Dialog */}
        {isEditScheduleDialogOpen && selectedScheduleForEdit && (
          <Dialog open={isEditScheduleDialogOpen} onOpenChange={setIsEditScheduleDialogOpen}>
            <DialogContent className="sm:max-w-md bg-gray-900/95 backdrop-blur-sm border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white text-right">
                  تعديل جدول العمل - {selectedScheduleForEdit.employeeName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div>
                  <Label className="text-white mb-2 block">الراتب (ريال)</Label>
                  <Input
                    type="number"
                    placeholder="أدخل الراتب"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    data-testid="edit-salary-input"
                  />
                </div>

                <div>
                  <Label className="text-white mb-2 block">نوع الجدول</Label>
                  <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="متصل">متصل</SelectItem>
                      <SelectItem value="منقسم">منقسم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleType === "متصل" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white mb-2 block">وقت الحضور</Label>
                        <Input
                          type="time"
                          value={continuousStartTime}
                          onChange={(e) => setContinuousStartTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-continuous-start-time"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">وقت الانصراف</Label>
                        <Input
                          type="time"
                          value={continuousEndTime}
                          onChange={(e) => setContinuousEndTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-continuous-end-time"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white mb-2 block">بداية الفترة الصباحية</Label>
                        <Input
                          type="time"
                          value={morningStartTime}
                          onChange={(e) => setMorningStartTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-morning-start-time"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">نهاية الفترة الصباحية</Label>
                        <Input
                          type="time"
                          value={morningEndTime}
                          onChange={(e) => setMorningEndTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-morning-end-time"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white mb-2 block">بداية الفترة المسائية</Label>
                        <Input
                          type="time"
                          value={eveningStartTime}
                          onChange={(e) => setEveningStartTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-evening-start-time"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">نهاية الفترة المسائية</Label>
                        <Input
                          type="time"
                          value={eveningEndTime}
                          onChange={(e) => setEveningEndTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-evening-end-time"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUpdateSchedule}
                    disabled={updateScheduleMutation.isPending || !salary}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="update-schedule-button"
                  >
                    {updateScheduleMutation.isPending ? "جارٍ التحديث..." : "تحديث الجدول"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditScheduleDialogOpen(false);
                      setSelectedScheduleForEdit(null);
                      resetScheduleForm();
                    }}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Day Dialog */}
        <Dialog open={isEditDayDialogOpen} onOpenChange={setIsEditDayDialogOpen}>
          <DialogContent 
            className="glass-container backdrop-blur-md bg-slate-900/90 border border-white/20 text-white max-w-2xl"
            aria-describedby="edit-day-dialog-description"
          >
            <DialogHeader>
              <DialogTitle className="text-xl text-center">
                تحرير بيانات اليوم
              </DialogTitle>
              {selectedDayForEdit && (
                <p className="text-gray-300 text-center">
                  {selectedDayForEdit.employee.employeeName} - {format(selectedDayForEdit.day, "EEEE، dd MMMM yyyy", { locale: ar })}
                </p>
              )}
            </DialogHeader>
            
            <div id="edit-day-dialog-description" className="sr-only">
              تحرير أوقات الحضور والانصراف للموظف في التاريخ المحدد
            </div>
            
            {selectedDayForEdit && (() => {
              const { employee, day, attendance } = selectedDayForEdit;

              const handleSaveDay = () => {
                const dateStr = format(day, "yyyy-MM-dd");
                
                if (!attendance) {
                  // Create new attendance record
                  const attendanceData = {
                    employeeId: employee.employeeId,
                    employeeName: employee.employeeName,
                    date: dateStr,
                    scheduleType: employee.scheduleType,
                    notes: editNotes,
                    ...(employee.scheduleType === "متصل" 
                      ? {
                          continuousCheckinTime: editCheckinTime,
                          continuousCheckoutTime: editCheckoutTime
                        }
                      : {
                          morningCheckinTime: editMorningCheckinTime,
                          morningCheckoutTime: editMorningCheckoutTime,
                          eveningCheckinTime: editEveningCheckinTime,
                          eveningCheckoutTime: editEveningCheckoutTime
                        }
                    )
                  };
                  createAttendanceMutation.mutate(attendanceData);
                } else {
                  // Update existing attendance
                  const updateData = {
                    ...attendance,
                    notes: editNotes,
                    date: dateStr,
                    ...(employee.scheduleType === "متصل" 
                      ? {
                          continuousCheckinTime: editCheckinTime,
                          continuousCheckoutTime: editCheckoutTime
                        }
                      : {
                          morningCheckinTime: editMorningCheckinTime,
                          morningCheckoutTime: editMorningCheckoutTime,
                          eveningCheckinTime: editEveningCheckinTime,
                          eveningCheckoutTime: editEveningCheckoutTime
                        }
                    )
                  };
                  updateAttendanceMutation.mutate({ attendanceId: attendance.id, updateData });
                }
                setIsEditDayDialogOpen(false);
              };

              return (
                <div className="space-y-6">
                  {employee.scheduleType === "متصل" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white mb-2 block">وقت الحضور</Label>
                        <Input
                          type="time"
                          value={editCheckinTime}
                          onChange={(e) => setEditCheckinTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-checkin-time"
                        />
                      </div>
                      <div>
                        <Label className="text-white mb-2 block">وقت الانصراف</Label>
                        <Input
                          type="time"
                          value={editCheckoutTime}
                          onChange={(e) => setEditCheckoutTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          data-testid="edit-checkout-time"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white mb-2 block">حضور الفترة الصباحية</Label>
                          <Input
                            type="time"
                            value={editMorningCheckinTime}
                            onChange={(e) => setEditMorningCheckinTime(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            data-testid="edit-morning-checkin-time"
                          />
                        </div>
                        <div>
                          <Label className="text-white mb-2 block">انصراف الفترة الصباحية</Label>
                          <Input
                            type="time"
                            value={editMorningCheckoutTime}
                            onChange={(e) => setEditMorningCheckoutTime(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            data-testid="edit-morning-checkout-time"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white mb-2 block">حضور الفترة المسائية</Label>
                          <Input
                            type="time"
                            value={editEveningCheckinTime}
                            onChange={(e) => setEditEveningCheckinTime(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            data-testid="edit-evening-checkin-time"
                          />
                        </div>
                        <div>
                          <Label className="text-white mb-2 block">انصراف الفترة المسائية</Label>
                          <Input
                            type="time"
                            value={editEveningCheckoutTime}
                            onChange={(e) => setEditEveningCheckoutTime(e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            data-testid="edit-evening-checkout-time"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label className="text-white mb-2 block">ملاحظات</Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="bg-white/10 border-white/20 text-white min-h-[80px]"
                      placeholder="أضف ملاحظات إضافية (اختياري)"
                      data-testid="edit-notes"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveDay}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="save-day-button"
                    >
                      حفظ التغييرات
                    </Button>
                    <Button
                      onClick={() => setIsEditDayDialogOpen(false)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      إلغاء
                    </Button>
                    {attendance && (
                      <Button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف سجل الحضور لهذا اليوم؟')) {
                            // Add delete functionality here if needed
                            setIsEditDayDialogOpen(false);
                          }
                        }}
                        variant="outline"
                        className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                      >
                        حذف السجل
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </GlassBackground>
  );
}