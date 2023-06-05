export interface TimeDataPayload {
  dateCreatedLocal: string;
  dateCreatedUTC: string;
  startTime: string;
  endTime: string;
  hoursLogged: number;
  comments?: string;
}
