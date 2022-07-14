import axios, { AxiosInstance } from "axios";

export type Election = {
  data: {
    start: number;
    end: number;
    title: string;
    description: string;
    candidates: string[];
  };
  results: {
    [key: string]: string;
  };
  canVote: boolean;
};

export class ElectionsClient {
  http: AxiosInstance;

  constructor(username: string, password: string) {
    this.http = axios.create({
      baseURL: process.env.REACT_APP_GATEWAY_URL,
      auth: {
        username,
        password,
      },
    });
  }

  getElections(): Promise<Election[]> {
    return this.http.get("/elections").then((res) => res.data.values);
  }

  vote(electionId: bigint, candidateId: number): Promise<void> {
    return this.http.post(`/elections/${electionId}/vote/${candidateId}`);
  }
}
