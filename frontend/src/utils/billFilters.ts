import {type Bill } from "../types/Bill";

export const getOverdueBills = (bills: Bill[], today: Date) =>
  bills.filter(
    b =>
      b.status === "pending" &&
      new Date(b.due_date) < today
  );

export const getUpcomingBills = (bills: Bill[], today: Date) =>
  bills.filter(b => {
    const d = new Date(b.due_date);
    return (
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });
