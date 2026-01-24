import { Router } from 'express';
import { authenticate, authorizeManager } from '../middlewares/auth.middleware';

const router = Router();

// All manager routes require authentication and manager authorization
router.use(authenticate);
router.use(authorizeManager);

// Dashboard
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalRenters: 24,
        pendingApprovals: 3,
        pendingComplaints: 7,
        pendingBills: 2,
        pendingVerifications: 5,
        totalTasks: 38,
        completedTasks: 15,
        monthlyRevenue: 25000,
        occupancyRate: 92
      },
      recentActivities: [
        {
          id: 1,
          type: 'renter_approval',
          title: 'New renter application received',
          time: '2 hours ago',
          status: 'pending',
          priority: 'high'
        },
        {
          id: 2,
          type: 'payment',
          title: 'Rent payment received from Apartment 302',
          time: '4 hours ago',
          status: 'completed',
          amount: 1200
        },
        {
          id: 3,
          type: 'complaint',
          title: 'Water leakage complaint in Apartment 105',
          time: '1 day ago',
          status: 'in_progress',
          priority: 'high'
        },
        {
          id: 4,
          type: 'bill_payment',
          title: 'Electricity bill due for Building A',
          time: '2 days ago',
          status: 'pending',
          amount: 850,
          dueDate: '2024-01-10'
        }
      ],
      quickStats: [
        { label: "Today's Tasks", value: 8, change: '+2', color: 'violet' },
        { label: 'Pending Approvals', value: 3, change: '-1', color: 'amber' },
        { label: 'Active Complaints', value: 7, change: '+3', color: 'rose' },
        { label: 'Bills Due', value: 2, change: '0', color: 'blue' }
      ],
      taskDistribution: [
        { name: 'Completed', value: 15, color: '#10b981' },
        { name: 'In Progress', value: 8, color: '#8b5cf6' },
        { name: 'Pending', value: 12, color: '#f59e0b' },
        { name: 'Overdue', value: 3, color: '#ef4444' }
      ]
    }
  });
});

// Renters Management
router.get('/renters', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      renters: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          apartment: '101',
          building: 'Building A',
          status: 'active',
          rentPaid: true,
          rentAmount: 1200,
          leaseStart: '2023-01-01',
          leaseEnd: '2024-12-31',
          documents: ['nid', 'contract']
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          apartment: '102',
          building: 'Building A',
          status: 'active',
          rentPaid: true,
          rentAmount: 1200,
          leaseStart: '2023-02-01',
          leaseEnd: '2024-11-30',
          documents: ['nid', 'contract']
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
          phone: '+1234567892',
          apartment: '103',
          building: 'Building A',
          status: 'pending',
          rentPaid: false,
          rentAmount: 1100,
          leaseStart: null,
          leaseEnd: null,
          documents: []
        },
        {
          id: '4',
          name: 'Alice Brown',
          email: 'alice.brown@example.com',
          phone: '+1234567893',
          apartment: '201',
          building: 'Building B',
          status: 'active',
          rentPaid: true,
          rentAmount: 1300,
          leaseStart: '2023-03-01',
          leaseEnd: '2024-10-31',
          documents: ['nid', 'contract', 'photo']
        },
        {
          id: '5',
          name: 'Charlie Wilson',
          email: 'charlie.wilson@example.com',
          phone: '+1234567894',
          apartment: '202',
          building: 'Building B',
          status: 'inactive',
          rentPaid: false,
          rentAmount: 1300,
          leaseStart: '2022-11-01',
          leaseEnd: '2023-10-31',
          documents: ['nid', 'contract']
        }
      ],
      summary: {
        total: 5,
        active: 3,
        pending: 1,
        inactive: 1,
        totalRent: 6100,
        collectedRent: 3700,
        occupancyRate: 80
      }
    }
  });
});

// Get specific renter
router.get('/renters/:id', (req, res) => {
  const { id } = req.params;
  
  res.status(200).json({
    success: true,
    data: {
      renter: {
        id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        apartment: '101',
        building: 'Building A',
        status: 'active',
        rentPaid: true,
        rentAmount: 1200,
        leaseStart: '2023-01-01',
        leaseEnd: '2024-12-31',
        documents: [
          { type: 'nid', url: '/documents/nid.jpg', uploadedAt: '2023-01-01' },
          { type: 'contract', url: '/documents/contract.pdf', uploadedAt: '2023-01-02' }
        ],
        familyMembers: [
          { name: 'Jane Doe', relation: 'Spouse', age: 30 },
          { name: 'Baby Doe', relation: 'Child', age: 2 }
        ],
        paymentHistory: [
          { month: 'December 2023', amount: 1200, status: 'paid', date: '2023-12-01' },
          { month: 'November 2023', amount: 1200, status: 'paid', date: '2023-11-01' },
          { month: 'October 2023', amount: 1200, status: 'paid', date: '2023-10-01' }
        ]
      }
    }
  });
});

// Approve renter
router.post('/renters/:id/approve', (req, res) => {
  const { id } = req.params;
  const { apartment, rentAmount, leaseStart, leaseEnd } = req.body;
  
  res.status(200).json({
    success: true,
    data: {
      message: `Renter ${id} approved successfully`,
      renter: {
        id,
        status: 'active',
        apartment,
        rentAmount,
        leaseStart,
        leaseEnd,
        approvedAt: new Date().toISOString()
      }
    }
  });
});

// Bills Management
router.get('/bills', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      bills: [
        {
          id: '1',
          type: 'electricity',
          building: 'Building A',
          amount: 850,
          dueDate: '2024-01-10',
          status: 'pending',
          provider: 'National Grid',
          accountNumber: 'NG-123456',
          month: 'December 2023'
        },
        {
          id: '2',
          type: 'water',
          building: 'Building A',
          amount: 320,
          dueDate: '2024-01-15',
          status: 'pending',
          provider: 'Water Corp',
          accountNumber: 'WC-789012',
          month: 'December 2023'
        },
        {
          id: '3',
          type: 'maintenance',
          building: 'Building A',
          amount: 1500,
          dueDate: '2024-01-20',
          status: 'paid',
          provider: 'Maintenance Co',
          accountNumber: 'MC-345678',
          month: 'January 2024',
          paidDate: '2024-01-05'
        },
        {
          id: '4',
          type: 'lift_maintenance',
          building: 'Building B',
          amount: 600,
          dueDate: '2024-01-25',
          status: 'pending',
          provider: 'Elevator Inc',
          accountNumber: 'EI-901234',
          month: 'January 2024'
        }
      ],
      summary: {
        totalPending: 1770,
        totalPaid: 1500,
        overdueBills: 1,
        nextDue: '2024-01-10'
      }
    }
  });
});

// Pay bill
router.post('/bills/:id/pay', (req, res) => {
  const { id } = req.params;
  const { paymentMethod, transactionId } = req.body;
  
  res.status(200).json({
    success: true,
    data: {
      message: `Bill ${id} paid successfully`,
      payment: {
        id: Date.now().toString(),
        billId: id,
        amount: 850,
        paymentMethod,
        transactionId,
        paidAt: new Date().toISOString(),
        status: 'completed'
      }
    }
  });
});

// Complaints Management
router.get('/complaints', (req, res) => {
  const { status } = req.query;
  
  let complaints = [
    {
      id: '1',
      renterId: '1',
      renterName: 'John Doe',
      apartment: '101',
      type: 'plumbing',
      title: 'Water leakage in bathroom',
      description: 'There is a constant water leakage from the bathroom tap.',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-05'
    },
    {
      id: '2',
      renterId: '2',
      renterName: 'Jane Smith',
      apartment: '102',
      type: 'electrical',
      title: 'Power outlet not working',
      description: 'The power outlet in the living room stopped working.',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2024-01-04',
      updatedAt: '2024-01-05',
      assignedTo: 'Maintenance Team',
      estimatedCompletion: '2024-01-08'
    },
    {
      id: '3',
      renterId: '4',
      renterName: 'Alice Brown',
      apartment: '201',
      type: 'elevator',
      title: 'Elevator making strange noise',
      description: 'The elevator makes loud grinding noises when moving.',
      status: 'resolved',
      priority: 'high',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-04',
      resolvedAt: '2024-01-04',
      resolution: 'Lubricated elevator cables and replaced worn parts'
    },
    {
      id: '4',
      renterId: '1',
      renterName: 'John Doe',
      apartment: '101',
      type: 'cleaning',
      title: 'Garbage disposal area needs cleaning',
      description: 'The garbage area is overflowing and smells bad.',
      status: 'pending',
      priority: 'low',
      createdAt: '2024-01-06',
      updatedAt: '2024-01-06'
    }
  ];

  // Filter by status if provided
  if (status) {
    complaints = complaints.filter(complaint => complaint.status === status);
  }

  res.status(200).json({
    success: true,
    data: {
      complaints,
      summary: {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
      }
    }
  });
});

// Update complaint status
router.put('/complaints/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, resolution, assignedTo, estimatedCompletion } = req.body;
  
  res.status(200).json({
    success: true,
    data: {
      message: `Complaint ${id} status updated to ${status}`,
      complaint: {
        id,
        status,
        resolution,
        assignedTo,
        estimatedCompletion,
        updatedAt: new Date().toISOString(),
        ...(status === 'resolved' && { resolvedAt: new Date().toISOString() })
      }
    }
  });
});

// Payments Verification
router.get('/payments/pending', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      pendingPayments: [
        {
          id: '1',
          renterId: '3',
          renterName: 'Bob Johnson',
          apartment: '103',
          type: 'rent',
          amount: 1100,
          month: 'January 2024',
          paymentDate: '2024-01-05',
          paymentMethod: 'bank_transfer',
          reference: 'TRX-123456',
          status: 'pending_verification',
          submittedAt: '2024-01-05T10:30:00Z'
        },
        {
          id: '2',
          renterId: '5',
          renterName: 'Charlie Wilson',
          apartment: '202',
          type: 'rent',
          amount: 1300,
          month: 'December 2023',
          paymentDate: '2024-01-04',
          paymentMethod: 'cash',
          reference: 'CASH-789',
          status: 'pending_verification',
          submittedAt: '2024-01-04T14:45:00Z'
        },
        {
          id: '3',
          renterId: '1',
          renterName: 'John Doe',
          apartment: '101',
          type: 'late_fee',
          amount: 50,
          month: 'January 2024',
          paymentDate: '2024-01-06',
          paymentMethod: 'mobile_banking',
          reference: 'MB-456789',
          status: 'pending_verification',
          submittedAt: '2024-01-06T09:15:00Z'
        }
      ],
      summary: {
        totalAmount: 2450,
        totalCount: 3,
        oldestPending: '2024-01-04'
      }
    }
  });
});

// Verify payment
router.post('/payments/:id/verify', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  res.status(200).json({
    success: true,
    data: {
      message: `Payment ${id} ${status}`,
      verification: {
        paymentId: id,
        status,
        notes,
        verifiedAt: new Date().toISOString(),
        verifiedBy: (req as any).user?.userId
      }
    }
  });
});

// Tasks Management
router.get('/tasks', (req, res) => {
  const { status, priority } = req.query;
  
  let tasks = [
    {
      id: '1',
      title: 'Approve new renter application',
      type: 'renter_approval',
      description: 'Review documents and approve Bob Johnson as new renter',
      status: 'pending',
      priority: 'high',
      dueDate: '2024-01-15',
      assignedTo: 'Self',
      createdAt: '2024-01-05'
    },
    {
      id: '2',
      title: 'Pay electricity bill',
      type: 'bill_payment',
      description: 'Pay December electricity bill for Building A',
      status: 'overdue',
      priority: 'high',
      dueDate: '2024-01-10',
      assignedTo: 'Self',
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      title: 'Fix elevator issue',
      type: 'complaint_resolution',
      description: 'Schedule maintenance for elevator noise complaint',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2024-01-20',
      assignedTo: 'Maintenance Team',
      createdAt: '2024-01-03',
      progress: 60
    },
    {
      id: '4',
      title: 'Verify rent payment from Apartment 103',
      type: 'payment_verification',
      description: 'Check bank statement for rent payment',
      status: 'pending',
      priority: 'medium',
      dueDate: '2024-01-12',
      assignedTo: 'Self',
      createdAt: '2024-01-05'
    },
    {
      id: '5',
      title: 'Monthly building inspection',
      type: 'inspection',
      description: 'Conduct monthly safety and maintenance inspection',
      status: 'completed',
      priority: 'low',
      dueDate: '2024-01-05',
      assignedTo: 'Self',
      createdAt: '2024-01-01',
      completedAt: '2024-01-05'
    }
  ];

  // Apply filters
  if (status) {
    tasks = tasks.filter(task => task.status === status);
  }
  if (priority) {
    tasks = tasks.filter(task => task.priority === priority);
  }

  res.status(200).json({
    success: true,
    data: {
      tasks,
      summary: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => t.status === 'overdue').length
      }
    }
  });
});

// Update task
router.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status, progress, assignedTo, dueDate } = req.body;
  
  res.status(200).json({
    success: true,
    data: {
      message: `Task ${id} updated successfully`,
      task: {
        id,
        status,
        progress,
        assignedTo,
        dueDate,
        updatedAt: new Date().toISOString(),
        ...(status === 'completed' && { completedAt: new Date().toISOString() })
      }
    }
  });
});

// Messages
router.get('/messages', (req, res) => {
  const { userId } = req.query;
  
  res.status(200).json({
    success: true,
    data: {
      conversations: [
        {
          id: '1',
          withUser: {
            id: '1',
            name: 'John Doe',
            role: 'renter',
            apartment: '101'
          },
          lastMessage: 'The water leakage is getting worse, please help!',
          lastMessageTime: '2024-01-06T14:30:00Z',
          unreadCount: 2,
          status: 'unread'
        },
        {
          id: '2',
          withUser: {
            id: '2',
            name: 'Sarah Owner',
            role: 'owner',
            building: 'Building A'
          },
          lastMessage: 'Can you send me the monthly report?',
          lastMessageTime: '2024-01-05T11:15:00Z',
          unreadCount: 0,
          status: 'read'
        },
        {
          id: '3',
          withUser: {
            id: '4',
            name: 'Alice Brown',
            role: 'renter',
            apartment: '201'
          },
          lastMessage: 'Thank you for fixing the elevator!',
          lastMessageTime: '2024-01-04T16:45:00Z',
          unreadCount: 0,
          status: 'read'
        }
      ],
      messages: userId ? [
        {
          id: '1',
          conversationId: '1',
          senderId: '1',
          senderName: 'John Doe',
          message: 'Hi, there is a water leakage in my bathroom.',
          timestamp: '2024-01-06T10:00:00Z',
          isOwn: false
        },
        {
          id: '2',
          conversationId: '1',
          senderId: 'manager',
          senderName: 'You',
          message: 'I will send a plumber tomorrow morning.',
          timestamp: '2024-01-06T10:15:00Z',
          isOwn: true
        },
        {
          id: '3',
          conversationId: '1',
          senderId: '1',
          senderName: 'John Doe',
          message: 'The water leakage is getting worse, please help!',
          timestamp: '2024-01-06T14:30:00Z',
          isOwn: false
        }
      ] : []
    }
  });
});

// Send message
router.post('/messages', (req, res) => {
  const { conversationId, receiverId, message } = req.body;
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Message sent successfully',
      sentMessage: {
        id: Date.now().toString(),
        conversationId,
        receiverId,
        message,
        senderId: (req as any).user?.userId,
        senderName: 'You',
        timestamp: new Date().toISOString(),
        isOwn: true,
        status: 'sent'
      }
    }
  });
});

export default router;