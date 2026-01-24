import React, { useState } from 'react';
import './payment.css';

const Payments = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMonth, setPaymentMonth] = useState('January 2026');
  const [amount, setAmount] = useState('15000');
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [transactionId, setTransactionId] = useState('');

  const paymentHistory = [
    { month: 'December 2025', amount: '+15,000', date: '2025-12-01', status: 'Confirmed' },
    { month: 'November 2025', amount: '+15,000', date: '2025-11-02', status: 'Confirmed' },
    { month: 'October 2025', amount: '+15,000', date: '2025-10-01', status: 'Confirmed' },
    { month: 'September 2025', amount: '+15,000', date: '2025-09-01', status: 'Confirmed' },
  ];

const handleSubmitPayment = (e: React.FormEvent) => {
  e.preventDefault();
  alert(`Payment submitted for ${paymentMonth}`);
  setShowPaymentForm(false);
  setTransactionId('');
};

  return (
    <div className="payments page-transition">
      <div className="payments-header">
        <h2>Payments</h2>
        <p>Manage your rent payments</p>
      </div>

      <div className="payment-overview">
        <div className="overview-card">
          <div className="overview-icon">💰</div>
          <div className="overview-content">
            <h3>Monthly Rent</h3>
            <p className="amount">+15,000</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">✅</div>
          <div className="overview-content">
            <h3>Current Month</h3>
            <p className="status paid">Paid</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">📅</div>
          <div className="overview-content">
            <h3>Next Due Date</h3>
            <p className="date">Jan 5, 2026</p>
          </div>
        </div>
      </div>

      <div className="payments-content">
        <div className="payments-main">
          <div className="section-header">
            <h3>Payment History</h3>
            <button
              className="make-payment-btn"
              onClick={() => setShowPaymentForm(true)}
            >
              💳 Make Payment
            </button>
          </div>

          <div className="payment-history-table">
            <div className="table-header">
              <div>Month</div>
              <div>Amount</div>
              <div>Date Paid</div>
              <div>Status</div>
            </div>
            {paymentHistory.map((payment, index) => (
              <div key={index} className="table-row">
                <div className="month">{payment.month}</div>
                <div className="amount">{payment.amount}</div>
                <div className="date">{payment.date}</div>
                <div className="status confirmed">{payment.status}</div>
              </div>
            ))}
          </div>
        </div>

        {showPaymentForm && (
          <div className="payment-form-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Make Payment</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowPaymentForm(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitPayment} className="payment-form">
                <div className="form-group">
                  <label>Payment Month</label>
                  <select
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="form-select"
                  >
                    <option>January 2026</option>
                    <option>February 2026</option>
                    <option>March 2026</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <div className="amount-input">
                    <span className="currency">$</span>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <div className="payment-methods">
                    <label className="method-option">
                      <input
                        type="radio"
                        value="bank-transfer"
                        checked={paymentMethod === 'bank-transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Bank Transfer</span>
                    </label>
                    <label className="method-option">
                      <input
                        type="radio"
                        value="credit-card"
                        checked={paymentMethod === 'credit-card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Credit Card</span>
                    </label>
                    <label className="method-option">
                      <input
                        type="radio"
                        value="mobile-banking"
                        checked={paymentMethod === 'mobile-banking'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>Mobile Banking</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Transaction ID / Reference</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="form-input"
                  />
                </div>

                <div className="form-buttons">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Submit Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;