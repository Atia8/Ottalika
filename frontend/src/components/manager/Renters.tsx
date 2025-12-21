// Renters.jsx
import React, { useState } from 'react';
import { FaSearch, FaFilter, FaUserPlus, FaDownload, FaEdit, FaTrash, FaEye } from 'react-icons/fa';

const Renters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock renters data
  const renters = [
    {
      id: 1,
      name: 'John Smith',
      unit: 'A-101',
      email: 'john.smith@email.com',
      phone: '+1 234-567-8901',
      moveInDate: '2024-01-15',
      rentAmount: '$1,200',
      status: 'Active',
      statusColor: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      unit: 'B-204',
      email: 'sarah.j@email.com',
      phone: '+1 234-567-8902',
      moveInDate: '2024-02-01',
      rentAmount: '$1,350',
      status: 'Active',
      statusColor: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 3,
      name: 'Michael Chen',
      unit: 'C-302',
      email: 'm.chen@email.com',
      phone: '+1 234-567-8903',
      moveInDate: '2024-02-15',
      rentAmount: '$1,500',
      status: 'Pending',
      statusColor: 'bg-amber-100 text-amber-700'
    },
    {
      id: 4,
      name: 'Emma Wilson',
      unit: 'A-205',
      email: 'emma.w@email.com',
      phone: '+1 234-567-8904',
      moveInDate: '2023-12-01',
      rentAmount: '$1,100',
      status: 'Overdue',
      statusColor: 'bg-rose-100 text-rose-700'
    },
    {
      id: 5,
      name: 'Robert Brown',
      unit: 'D-101',
      email: 'robert.b@email.com',
      phone: '+1 234-567-8905',
      moveInDate: '2024-01-01',
      rentAmount: '$1,400',
      status: 'Active',
      statusColor: 'bg-emerald-100 text-emerald-700'
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const filteredRenters = renters.filter(renter => {
    const matchesSearch = renter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         renter.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         renter.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Renters Management</h1>
          <p className="text-slate-600">Manage all renters in your building</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium">
          <FaUserPlus className="mr-2" />
          Add New Renter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Renters', value: '24', color: 'bg-blue-50 text-blue-600', trend: '+2 this month' },
          { title: 'Active', value: '18', color: 'bg-emerald-50 text-emerald-600', trend: '94% occupancy' },
          { title: 'Pending', value: '3', color: 'bg-amber-50 text-amber-600', trend: 'Needs review' },
          { title: 'Overdue', value: '3', color: 'bg-rose-50 text-rose-600', trend: 'Requires attention' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">{stat.title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            <p className={`text-xs ${stat.color} mt-2`}>{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search renters by name, unit, or email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-slate-400" />
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <FaDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Renters Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-slate-700">Renter</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700">Unit</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700">Move-in Date</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700">Rent</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700">Status</th>
                <th className="text-left p-4 text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRenters.map(renter => (
                <tr key={renter.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {renter.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{renter.name}</p>
                        <p className="text-sm text-slate-500">{renter.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-slate-900">{renter.unit}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-900">{renter.phone}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-900">{renter.moveInDate}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{renter.rentAmount}<span className="text-slate-500 text-sm">/month</span></p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${renter.statusColor}`}>
                      {renter.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600">
                        <FaEye />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-amber-600">
                        <FaEdit />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-rose-600">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">Showing 5 of 24 renters</p>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
              1
            </button>
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              2
            </button>
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              3
            </button>
            <button className="px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Renters;