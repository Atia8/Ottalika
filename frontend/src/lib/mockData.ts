// Mock data for the application

export const mockRenters = [
  {
    id: 1,
    name: "Ahmed Rahman",
    apartment: "A-101",
    phone: "+880 1712-345678",
    email: "ahmed.rahman@email.com",
    status: "approved",
    rentAmount: 15000,
    lastPayment: "2025-12-01",
    paymentStatus: "paid",
    joinDate: "2024-01-15",
    documents: {
      nid: true,
      photo: true,
      familyInfo: true
    }
  },
  {
    id: 2,
    name: "Fatima Begum",
    apartment: "B-205",
    phone: "+880 1823-456789",
    email: "fatima.begum@email.com",
    status: "approved",
    rentAmount: 18000,
    lastPayment: "2025-12-05",
    paymentStatus: "paid",
    joinDate: "2024-03-20",
    documents: {
      nid: true,
      photo: true,
      familyInfo: true
    }
  },
  {
    id: 3,
    name: "Karim Hassan",
    apartment: "C-302",
    phone: "+880 1934-567890",
    email: "karim.hassan@email.com",
    status: "pending",
    rentAmount: 20000,
    lastPayment: "2025-11-28",
    paymentStatus: "unpaid",
    joinDate: "2024-06-10",
    documents: {
      nid: true,
      photo: false,
      familyInfo: true
    }
  },
  {
    id: 4,
    name: "Sadia Islam",
    apartment: "D-401",
    phone: "+880 1645-678901",
    email: "sadia.islam@email.com",
    status: "approved",
    rentAmount: 16000,
    lastPayment: null,
    paymentStatus: "unpaid",
    joinDate: "2024-09-05",
    documents: {
      nid: true,
      photo: true,
      familyInfo: false
    }
  },
  {
    id: 5,
    name: "Rashid Ali",
    apartment: "E-503",
    phone: "+880 1756-789012",
    email: "rashid.ali@email.com",
    status: "approved",
    rentAmount: 22000,
    lastPayment: "2025-12-03",
    paymentStatus: "paid",
    joinDate: "2023-11-12",
    documents: {
      nid: true,
      photo: true,
      familyInfo: true
    }
  }
];

export const mockComplaints = [
  {
    id: 1,
    renterId: 1,
    renterName: "Ahmed Rahman",
    apartment: "A-101",
    title: "Water Leakage in Bathroom",
    description: "There is continuous water leakage from the ceiling in the bathroom.",
    category: "plumbing",
    priority: "high",
    status: "pending",
    createdAt: "2025-12-10",
    resolvedAt: null
  },
  {
    id: 2,
    renterId: 2,
    renterName: "Fatima Begum",
    apartment: "B-205",
    title: "Elevator Not Working",
    description: "The elevator has been out of service for 3 days.",
    category: "electrical",
    priority: "high",
    status: "in-progress",
    createdAt: "2025-12-08",
    resolvedAt: null
  },
  {
    id: 3,
    renterId: 5,
    renterName: "Rashid Ali",
    apartment: "E-503",
    title: "Door Lock Issue",
    description: "The main door lock is jammed and difficult to open.",
    category: "maintenance",
    priority: "medium",
    status: "resolved",
    createdAt: "2025-12-05",
    resolvedAt: "2025-12-07"
  },
  {
    id: 4,
    renterId: 3,
    renterName: "Karim Hassan",
    apartment: "C-302",
    title: "AC Not Cooling",
    description: "Air conditioner in bedroom is not cooling properly.",
    category: "electrical",
    priority: "medium",
    status: "pending",
    createdAt: "2025-12-11",
    resolvedAt: null
  }
];

export const mockBills = [
  {
    id: 1,
    type: "electricity",
    amount: 12500,
    month: "December 2025",
    dueDate: "2025-12-15",
    status: "paid",
    paidDate: "2025-12-10"
  },
  {
    id: 2,
    type: "lift",
    amount: 3000,
    month: "December 2025",
    dueDate: "2025-12-20",
    status: "pending",
    paidDate: null
  },
  {
    id: 3,
    type: "water",
    amount: 4500,
    month: "December 2025",
    dueDate: "2025-12-18",
    status: "pending",
    paidDate: null
  },
  {
    id: 4,
    type: "maintenance",
    amount: 5000,
    month: "December 2025",
    dueDate: "2025-12-25",
    status: "pending",
    paidDate: null
  }
];

export const mockPayments = [
  {
    id: 1,
    renterId: 1,
    renterName: "Ahmed Rahman",
    apartment: "A-101",
    amount: 15000,
    month: "December 2025",
    paidDate: "2025-12-01",
    status: "confirmed"
  },
  {
    id: 2,
    renterId: 2,
    renterName: "Fatima Begum",
    apartment: "B-205",
    amount: 18000,
    month: "December 2025",
    paidDate: "2025-12-05",
    status: "confirmed"
  },
  {
    id: 3,
    renterId: 5,
    renterName: "Rashid Ali",
    apartment: "E-503",
    amount: 22000,
    month: "December 2025",
    paidDate: "2025-12-03",
    status: "confirmed"
  },
  {
    id: 4,
    renterId: 1,
    renterName: "Ahmed Rahman",
    apartment: "A-101",
    amount: 15000,
    month: "November 2025",
    paidDate: "2025-11-02",
    status: "confirmed"
  },
  {
    id: 5,
    renterId: 2,
    renterName: "Fatima Begum",
    apartment: "B-205",
    amount: 18000,
    month: "November 2025",
    paidDate: "2025-11-06",
    status: "confirmed"
  }
];

export const mockMessages = [
  {
    id: 1,
    from: "manager",
    to: "renter",
    sender: "Building Manager",
    content: "Please submit your December rent payment by the 5th.",
    timestamp: "2025-12-01 10:30 AM",
    read: true
  },
  {
    id: 2,
    from: "renter",
    to: "manager",
    sender: "Ahmed Rahman",
    content: "I have made the payment. Please confirm.",
    timestamp: "2025-12-01 02:15 PM",
    read: true
  },
  {
    id: 3,
    from: "manager",
    to: "renter",
    sender: "Building Manager",
    content: "Payment confirmed. Thank you!",
    timestamp: "2025-12-01 03:00 PM",
    read: true
  },
  {
    id: 4,
    from: "renter",
    to: "manager",
    sender: "Ahmed Rahman",
    content: "I need to speak with the owner about extending my lease.",
    timestamp: "2025-12-10 09:00 AM",
    read: false
  }
];

export const mockAnalytics = {
  monthlyIncome: [
    { month: "Jun", income: 91000, expenses: 35000, profit: 56000 },
    { month: "Jul", income: 91000, expenses: 28000, profit: 63000 },
    { month: "Aug", income: 91000, expenses: 42000, profit: 49000 },
    { month: "Sep", income: 91000, expenses: 31000, profit: 60000 },
    { month: "Oct", income: 91000, expenses: 38000, profit: 53000 },
    { month: "Nov", income: 91000, expenses: 33000, profit: 58000 },
    { month: "Dec", income: 71000, expenses: 25000, profit: 46000 }
  ],
  totalIncome: 71000,
  totalExpenses: 25000,
  totalProfit: 46000,
  occupancyRate: 80,
  pendingPayments: 2
};

export const mockOwnerRequests = [
  {
    id: 1,
    renterId: 1,
    renterName: "Ahmed Rahman",
    apartment: "A-101",
    subject: "Lease Extension Request",
    message: "I would like to extend my lease for another year. Please advise on the process.",
    createdAt: "2025-12-10",
    status: "pending"
  },
  {
    id: 2,
    renterId: 4,
    renterName: "Sadia Islam",
    apartment: "D-401",
    subject: "Renovation Permission",
    message: "I want to install custom kitchen cabinets. Seeking permission from owner.",
    createdAt: "2025-12-08",
    status: "pending"
  },
  {
    id: 3,
    renterId: 2,
    renterName: "Fatima Begum",
    apartment: "B-205",
    subject: "Parking Space Request",
    message: "Requesting additional parking space for second vehicle.",
    createdAt: "2025-12-06",
    status: "approved"
  }
];
