import { LeaveRequest } from "./../types/pages/main";
import type { FormControl } from "../types/control";
import type { ODataError, ODataResponses } from "../types/odata";
import type { Dict } from "../types/utils";
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
import MessageBox from "sap/m/MessageBox";

/**
 * @namespace myapp.ui5.controller
 */

export default class Create extends BaseController {
	private view: View;

	public override onInit(): void {
		this.view = this.getView();

		this.setModel(
			new JSONModel({
				LeaveType: "",
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

	// #endregion

	public onSaveDraftProcess() {
		const oDataModel = this.getModel<ODataModel>();

		const formModel = this.getModel("form");
		const formData = <Dict<string>>formModel.getData();

		const controls = this.getControlsByFieldGroup<FormControl>({
			container: this.view,
			groupId: "FormField",
		});

		const isValid = this.validateControls(controls);

		if (!isValid) {
			return;
		}

		const { LeaveType, StartDate, EndDate, Reason } = formData;

		this.setViewBusy(true);
		oDataModel.create(
			"/LeaveRequestSet",
			{
				LeaveType,
				StartDate: this.formatter.stringToDate(StartDate),
				EndDate: this.formatter.stringToDate(EndDate),
				Reason,
				Action: "Draft",
			},
			{
				success: (response: ODataResponses<LeaveRequest>) => {
					this.setViewBusy(false);

					this.displayTarget({
						target: "processSuccess",
						title: "Request has been saved",
						description: "",
					});
					console.log(response);
				},
				error: (error: ODataError) => {
					this.setViewBusy(false);
					console.log(error);
				},
			}
		);
	}

	public onSubmitProcess() {
		MessageBox.confirm("Do you want to submit this request?", {
			actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.OK,
			onClose: (action: unknown) => {
				if (action === MessageBox.Action.OK) {
					const oDataModel = this.getModel<ODataModel>();

					const formModel = this.getModel("form");

					const formData = <Dict<string>>formModel.getData();

					const controls = this.getControlsByFieldGroup<FormControl>({
						container: this.view,
						groupId: "FormField",
					});

					const isValid = this.validateControls(controls);

					if (!isValid) {
						return;
					}

					const { LeaveType, StartDate, EndDate, Reason } = formData;

					this.setViewBusy(true);
					oDataModel.create(
						"/LeaveRequestSet",
						{
							LeaveType,
							StartDate: this.formatter.stringToDate(StartDate),
							EndDate: this.formatter.stringToDate(EndDate),
							Reason,
							Action: "Submit",
						},
						{
							success: (response: ODataResponses<LeaveRequest>) => {
								this.setViewBusy(false);

								this.displayTarget({
									target: "processSuccess",
									title: "Request has been sent",
									description: "",
								});
								console.log(response);
							},
							error: (error: ODataError) => {
								this.setViewBusy(false);
								console.log(error);
							},
						}
					);
				}
			},
		});
	}

	// #region Validation
	public onChangeValue(event: Event) {
		try {
			const control = event.getSource<FormControl>();

			if (control.getVisible()) {
				this.validateControl(control);
			}
		} catch (error) {
			console.log(error);
		}
	}

	private validateControls(controls: FormControl[]) {
		let isValid = false;
		let isError = false;

		controls.forEach((control) => {
			isError = this.validateControl(control);
			isValid = isValid || isError;
		});

		return !isValid;
	}

	private validateControl(control: FormControl): boolean {
		let isError = false;

		this.setMessageState(control, {
			message: "",
			severity: "None",
		});

		let requiredError = false;
		let outOfRangeError = false;
		let dateRangeError = false;
		let value: string = "";

		if (control.isA<Input | TextArea>(["sap.m.Input", "sap.m.TextArea"])) {
			value = control.getValue();
			if (!value && control.getRequired()) {
				requiredError = true;
			}
		} else if (control.isA<DatePicker>("sap.m.DatePicker")) {
			value = control.getValue();
			if (!value && control.getRequired()) {
				requiredError = true;
			} else if (value && !control.isValidValue()) {
				outOfRangeError = true;
			} else {
				const controlId = this.getControlId(control);

				const isStartDate = controlId === "StartDate";
				const symetricId = isStartDate ? "EndDate" : "StartDate";
				const symetricControl = this.getControlById<DatePicker>(symetricId);

				const startDate = control.getDateValue();
				const endDate = symetricControl.getDateValue();

				if (startDate && endDate) {
					dateRangeError = isStartDate
						? startDate >= endDate
						: startDate <= endDate;

					if (!dateRangeError) {
						this.setMessageState(symetricControl, {
							message: "",
							severity: "None",
						});
					}
				}
			}
		} else if (control.isA<Select>("sap.m.Select")) {
			value = control.getSelectedKey();
			if (!value && control.getRequired()) {
				requiredError = true;
			}
		}

		if (requiredError) {
			this.setMessageState(control, {
				message: "Required",
				severity: "Error",
			});

			isError = true;
		} else if (outOfRangeError) {
			this.setMessageState(control, {
				message: "Invalid value",
				severity: "Error",
			});

			isError = true;
		} else if (dateRangeError) {
			this.setMessageState(control, {
				message: "Start date must be before end date",
				severity: "Error",
			});

			isError = true;
		}

		return isError;
	}

	private setMessageState(
		control: FormControl,
		options: {
			message: string;
			severity: keyof typeof ValueState;
		}
	) {
		const { message, severity } = options;

		control.setValueStateText(message);
		control.setValueState(severity);
	}
	// #endregion
}
