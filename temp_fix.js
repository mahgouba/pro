// This is a simplified version of the progress calculation logic
// for early departure that should work correctly

function calculateEarlyDepartureProgress(hoursWorked, expectedHours, earlyDepartureHours) {
  // Calculate actual work percentage considering early departure permission
  const effectiveWorkHours = Math.max(0, expectedHours - earlyDepartureHours);
  
  if (effectiveWorkHours === 0) {
    return { percentage: 100, color: 'purple' };
  }
  
  const actualWorkPercentage = Math.min(100, (hoursWorked / effectiveWorkHours) * 100);
  
  return {
    percentage: actualWorkPercentage,
    color: 'purple', // Always purple for early departure
    display: `${hoursWorked}h / ${effectiveWorkHours}h expected`
  };
}

// Test case: 8 hours worked, 10 expected, 2 hours early departure
console.log(calculateEarlyDepartureProgress(8, 10, 2)); 
// Should return: { percentage: 100, color: 'purple', display: '8h / 8h expected' }