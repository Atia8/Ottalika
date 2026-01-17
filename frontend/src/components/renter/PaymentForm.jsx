import React, { useState } from 'react';
import './PaymentForm.css';

const PaymentForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    paymentMonth: 'January 2026',
    amount: '15000',
    paymentMethod: 'bank-transfer',
    transactionId: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="payment-form-container">
      <div className="payment-form-header">
        <h3>Make Payment</h3>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label htmlFor="paymentMonth">Payment Month</label>
          <select
            id="paymentMonth"
            name="paymentMonth"
            value={formData.paymentMonth}
            onChange={handleChange}
            className="form-select"
          >
            <option value="January 2026">January 2026</option>
            <option value="February 2026">February 2026</option>
            <option value="March 2026">March 2026</option>
            <option value="April 2026">April 2026</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <div className="amount-input-group">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <div className="payment-methods">
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="bank-transfer"
                checked={formData.paymentMethod === 'bank-transfer'}
                onChange={handleChange}
              />
              <span>Bank Transfer</span>
            </label>

            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="credit-card"
                checked={formData.paymentMethod === 'credit-card'}
                onChange={handleChange}
              />
              <span>Credit Card</span>
            </label>

            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="mobile-banking"
                checked={formData.paymentMethod === 'mobile-banking'}
                onChange={handleChange}
              />
              <span>Mobile Banking</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="transactionId">Transaction ID / Reference</label>
          <input
            type="text"
            id="transactionId"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter transaction ID"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
          >
            Submit Payment
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;