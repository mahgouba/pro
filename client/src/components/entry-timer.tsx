interface EntryTimerProps {
  entryDate: string | Date;
  className?: string;
}

export function EntryTimer({ entryDate, className = "" }: EntryTimerProps) {
  // حساب عدد الأيام منذ تاريخ الدخول
  const calculateDaysSinceEntry = () => {
    const today = new Date();
    const entry = new Date(entryDate);
    const diffTime = today.getTime() - entry.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceEntry = calculateDaysSinceEntry();
  
  // تحديد اللون حسب عدد الأيام
  const getTimerColors = () => {
    if (daysSinceEntry <= 15) {
      return {
        ringColor: "text-green-500 dark:text-green-400",
        bgColor: "text-green-200 dark:text-green-800",
        textColor: "text-yellow-600 dark:text-yellow-300" // ذهبي
      };
    } else if (daysSinceEntry <= 28) {
      return {
        ringColor: "text-yellow-500 dark:text-yellow-400", 
        bgColor: "text-yellow-200 dark:text-yellow-800",
        textColor: "text-yellow-600 dark:text-yellow-300" // ذهبي
      };
    } else {
      return {
        ringColor: "text-red-500 dark:text-red-400",
        bgColor: "text-red-200 dark:text-red-800", 
        textColor: "text-yellow-600 dark:text-yellow-300" // ذهبي
      };
    }
  };
  
  const colors = getTimerColors();
  
  // حساب نسبة التقدم (من 0 إلى 30 يوم = 100%)
  const progressPercentage = Math.min((daysSinceEntry / 30) * 100, 100);
  const strokeDasharray = 2 * Math.PI * 16; // محيط الدائرة (r = 16)
  const strokeDashoffset = strokeDasharray - (progressPercentage / 100) * strokeDasharray;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* الحلقة الدائرية */}
      <svg
        className="w-10 h-10 transform -rotate-90"
        viewBox="0 0 40 40"
      >
        {/* الخلفية */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className={colors.bgColor}
          opacity="0.3"
        />
        {/* التقدم */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colors.ringColor} transition-all duration-300`}
        />
      </svg>
      
      {/* النص داخل الحلقة */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${colors.textColor}`}>
          {daysSinceEntry}
        </span>
      </div>
    </div>
  );
}