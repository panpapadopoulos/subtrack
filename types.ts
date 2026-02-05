
export interface Job {
  id: string;
  date: string;
  className: string;
  teacher: string;
  school: string;
  town: 'Munster' | 'Highland' | string;
  dayType: 0.5 | 1;
  fromTime: string;
  toTime: string;
  hours: number;
}

export interface Payment {
  id: string;
  date: string;
  town: string;
  amount: number;
}

export interface AppState {
  jobs: Job[];
  payments: Payment[];
}
