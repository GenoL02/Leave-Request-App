export interface LeaveRequest {
  RequestId: string;
  LeaveType: string;
  Action: string;
  EmployeeId: string;
  StartDate: string;
  EndDate: string;
  Reason: string;
  Status: string;
  CreatedOn: string;
  CreatedBy: string;
}
