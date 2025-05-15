import type { FormControl } from "lrm/types/control";
import type { ODataError, ODataResponses } from "lrm/types/odata";
import type { LeaveRequest } from "lrm/types/pages/main";
import type { Dict } from "lrm/types/utils";
import type DatePicker from "sap/m/DatePicker";
import type Input from "sap/m/Input";
import type Select from "sap/m/Select";
import type TextArea from "sap/m/TextArea";
import type Event from "sap/ui/base/Event";
import type { ValueState } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseController from "./Base.controller";
import Details from "./Details.controller";

/**
 * @namespace myapp.ui5.controller
 */

export default class Create extends BaseController {
	private view: View;

	public override onInit(): void {
		this.view = this.getView();

		this.setModel(
			new JSONModel({
				leaveType: "",
				StartDate: "",
				EndDate: "",
				Reason: "",
			}),
			"form"
		);

		this.setModel(
			new JSONModel({
				busy: false,
				delay: this.view.getBusyIndicatorDelay(),
			}),
			"view"
		);
	}
	// #region Router
	public onBackToWorkList(): void {
		// this.getRouter().navTo("RouteMain");
		const details = new Details("");
		details.onBackToWorkList(this.getRouter());
	}

	// #region Busy state
	private setViewBusy(isBusy: boolean) {
		this.getModel("view").setProperty("/busy", isBusy);
	}
}
