import axios from "axios";

const API_URL = "http://localhost:5000/api/requests";

export const getRenterRequests = async (renterId: number) => {
  const res = await axios.get(
    `${API_URL}/renter/${renterId}`
  );
  return res.data;
};

export const createRenterRequest = async (data: any) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};