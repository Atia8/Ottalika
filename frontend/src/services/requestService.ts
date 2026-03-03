import axios from "axios";
import { type OwnerRequest } from "../types/request";

const API_URL = "http://localhost:5000/api/requests";

export const getRequests = async (): Promise<OwnerRequest[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const updateRequestStatus = async (
  id: number,
  status: "approved" | "rejected"
) => {
  await axios.put(`${API_URL}/${id}/status`, { status });
};