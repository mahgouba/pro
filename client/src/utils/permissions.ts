// Permission utilities for role-based access control

export type UserRole = 'admin' | 'accountant' | 'salesperson' | 'inventory_manager' | 'bank_accountant' | 'sales_director' | 'user' | 'seller';

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canReserve: boolean;
}

// Define permissions for each role and page
export const PERMISSIONS: Record<UserRole, Record<string, Permission>> = {
  admin: {
    // Admin has full access to everything
    inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    cardView: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    quotationCreation: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    quotationManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    invoiceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    reservations: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    soldVehicles: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    financingCalculator: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    priceCards: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    userManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    bankManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    leaveRequests: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    attendanceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
  },
  
  accountant: {
    // Accountant can access inventory, price cards, quotations, financing, sales but cannot delete items
    inventory: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    cardView: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    quotationCreation: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    quotationManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    invoiceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    reservations: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    soldVehicles: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    financingCalculator: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    priceCards: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    leaveRequests: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: false, canReserve: false },
    attendanceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: false, canReserve: false },
  },

  salesperson: {
    // Salesperson can access card view and quotations for reservations and sharing
    inventory: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    cardView: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    quotationCreation: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    quotationManagement: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    invoiceManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    reservations: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    soldVehicles: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    financingCalculator: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    priceCards: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    leaveRequests: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    attendanceManagement: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: false, canReserve: false },
  },



  inventory_manager: {
    // مدير المخزون - Full access to main page, inventory, reservations, sales, and bank management
    inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    cardView: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    quotationCreation: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    quotationManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    invoiceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    reservations: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    soldVehicles: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    financingCalculator: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    priceCards: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    leaveRequests: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: false, canReserve: false },
    attendanceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: false, canReserve: false },
  },

  bank_accountant: {
    // محاسب البنوك - Limited access: main page and inventory with only share/reserve buttons (no price cards)
    inventory: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    cardView: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    quotationCreation: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    quotationManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    invoiceManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    reservations: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    soldVehicles: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    financingCalculator: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    priceCards: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    leaveRequests: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    attendanceManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
  },

  sales_director: {
    // مدير المبيعات - Full access to main page, inventory, sales, reservations, attendance, and pending leave requests
    inventory: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    cardView: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    quotationCreation: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    quotationManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    invoiceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    reservations: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    soldVehicles: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: true },
    financingCalculator: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    priceCards: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: true, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    leaveRequests: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: false, canReserve: false },
    attendanceManagement: { canView: true, canCreate: true, canEdit: true, canDelete: true, canShare: false, canReserve: false },
  },

  // User role (مندوب مبيعات عام) - Similar to salesperson but with more access
  user: {
    inventory: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    cardView: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    quotationCreation: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    quotationManagement: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    invoiceManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    reservations: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: true },
    soldVehicles: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    financingCalculator: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    priceCards: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    leaveRequests: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    attendanceManagement: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: false, canReserve: false },
  },

  // Seller role (بائع) - Limited access similar to salesperson
  seller: {
    inventory: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    cardView: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    quotationCreation: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    quotationManagement: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    invoiceManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    reservations: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: true },
    soldVehicles: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    financingCalculator: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    priceCards: { canView: true, canCreate: true, canEdit: true, canDelete: false, canShare: true, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    leaveRequests: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    attendanceManagement: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: false, canReserve: false },
  }
};

// Helper functions to check permissions
export const hasPermission = (userRole: UserRole, page: string, action: keyof Permission): boolean => {
  // Convert role to UserRole type if it's a string from database
  const normalizedRole = userRole as UserRole;
  
  // Check if the role exists in our permissions
  if (!PERMISSIONS[normalizedRole]) {
    console.warn(`Unknown user role: ${userRole}. Defaulting to no permissions.`);
    return false;
  }
  
  const rolePermissions = PERMISSIONS[normalizedRole];
  const pagePermissions = rolePermissions?.[page];
  
  if (!pagePermissions) {
    console.warn(`No permissions defined for page '${page}' and role '${userRole}'`);
    return false; // No permissions defined for this page
  }
  
  return pagePermissions[action];
};

export const canViewPage = (userRole: UserRole, page: string): boolean => {
  return hasPermission(userRole, page, 'canView');
};

export const canCreateItem = (userRole: UserRole, page: string): boolean => {
  return hasPermission(userRole, page, 'canCreate');
};

export const canEditItem = (userRole: UserRole, page: string): boolean => {
  return hasPermission(userRole, page, 'canEdit');
};

export const canDeleteItem = (userRole: UserRole, page: string): boolean => {
  return hasPermission(userRole, page, 'canDelete');
};

export const canShareItem = (userRole: UserRole, page: string): boolean => {
  return hasPermission(userRole, page, 'canShare');
};

export const canReserveItem = (userRole: UserRole, page: string): boolean => {
  return hasPermission(userRole, page, 'canReserve');
};

// Get allowed pages for a user role
export const getAllowedPages = (userRole: UserRole): string[] => {
  const normalizedRole = userRole as UserRole;
  
  if (!PERMISSIONS[normalizedRole]) {
    console.warn(`Unknown user role: ${userRole}. Returning empty pages array.`);
    return [];
  }
  
  const rolePermissions = PERMISSIONS[normalizedRole];
  return Object.keys(rolePermissions).filter(page => rolePermissions[page].canView);
};

// Check if user should see navigation item
export const shouldShowNavItem = (userRole: UserRole, page: string): boolean => {
  try {
    return canViewPage(userRole, page);
  } catch (error) {
    console.warn(`Error checking navigation permissions for role '${userRole}' and page '${page}':`, error);
    return false;
  }
};

// Add a fallback default role for unknown roles
export const getDefaultPermissions = (): Record<string, Permission> => {
  return {
    inventory: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    cardView: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    quotationCreation: { canView: true, canCreate: true, canEdit: false, canDelete: false, canShare: true, canReserve: false },
    quotationManagement: { canView: true, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    invoiceManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    reservations: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    soldVehicles: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    financingCalculator: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    priceCards: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    userManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    bankManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    leaveRequests: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
    attendanceManagement: { canView: false, canCreate: false, canEdit: false, canDelete: false, canShare: false, canReserve: false },
  };
};