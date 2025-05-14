import type { LeaveRequest } from "../types/pages/main";
import UI5Date from "sap/ui/core/date/UI5Date";
import DateFormat from "sap/ui/core/format/DateFormat";
import { ValueState } from "sap/ui/core/library";

class Formatter {
	public stringToDate(value: string, pattern: string = "yyyyMMdd") {
		if (!value) return null;

		const instance = DateFormat.getDateInstance({
			pattern,
		});

		return instance.parse(value);
	}

	public formatDate(value: Date | string, pattern: string = "dd.MM.yyyy") {
		if (!value) return "";

		const instance = DateFormat.getDateInstance({
			pattern,
		});

		const parsedValue =
			typeof value === "string" ? instance.parse(value) : value;

		return instance.format(parsedValue);
	}

	public dateNow(pattern: string = "yyyy-MM-dd") {
		return DateFormat.getDateInstance({ pattern }).format(
			UI5Date.getInstance()
		);
	}

	public formatStatus(value: string) {
		switch (value) {
			case "Submit":
				return ValueState.Information;
			case "Draft":
				return ValueState.None;
			case "Approve":
				return ValueState.Success;
			case "Reject":
				return ValueState.Error;
			default:
				return ValueState.None;
		}
	}

	public formatSubmitButtonVisibility(selectedRows: LeaveRequest[]) {
		return (
			selectedRows.length > 0 &&
			selectedRows.some((row) => row.Status === "Submit")
		);
	}
}

export default new Formatter();
