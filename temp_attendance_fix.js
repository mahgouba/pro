// Simplified color logic for attendance progress bars
function getAttendanceColor(workPercentage, approvedLeave) {
  // Priority 1: Approved leave types (override everything)
  if (approvedLeave && approvedLeave.requestType === 'انصراف مبكر') {
    return {
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      icon: 'UserClock',
      width: workPercentage
    };
  }
  
  if (approvedLeave && approvedLeave.requestType === 'استئذان') {
    return {
      color: 'bg-gradient-to-r from-blue-500 to-blue-600', 
      icon: 'Clock',
      width: workPercentage
    };
  }
  
  if (approvedLeave && approvedLeave.requestType === 'تأخير') {
    return {
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: 'Clock', 
      width: workPercentage
    };
  }
  
  // Priority 2: Regular attendance levels
  if (workPercentage >= 100) {
    return {
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      icon: 'CheckCircle',
      width: 100
    };
  }
  
  if (workPercentage >= 75) {
    return {
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      icon: 'Clock',
      width: workPercentage
    };
  }
  
  if (workPercentage >= 50) {
    return {
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      icon: 'Clock',
      width: workPercentage
    };
  }
  
  return {
    color: 'bg-gradient-to-r from-orange-500 to-red-500',
    icon: 'Clock', 
    width: Math.max(workPercentage, 10)
  };
}