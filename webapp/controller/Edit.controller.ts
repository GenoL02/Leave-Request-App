import { LeaveRequest } from "./../types/pages/main";
import type { FormControl } from "../types/control";
import type { ODataError, ODataResponses } from "../types/odata";
import type { Dict } from "../types/utils";
import type DatePicker from "sap/m/DatePicker";
import type Input from "sap/m/Input";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type Select from "sap/m/Select";
import type TextArea from "sap/m/TextArea";
import type Event from "sap/ui/base/Event";
import type { ValueState } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type Router from "sap/ui/core/routing/Router";
import Filter from "sap/ui/model/Filter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseController from "./Base.controller";
import Details from "./Details.controller";
import Create from "./Create.controller";

/**
 * @namespace myapp.ui5.controller
 */
export default class Edit extends BaseController {
	private view: View;
	private router: Router;

	public override onInit(): void {
		this.view = this.getView();
		this.router = this.getRouter();

		this.setModel(
			new JSONModel({
				busy: true,
				delay: this.view.getBusyIndicatorDelay(),
				canSubmit: false,
			}),
			"view"
		);

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
				requestId: "",
				EmployeeId: "",
				CreatedBy: "",
				CreatedOn: "",
				Status: "",
			}),
			"section"
		);

		// Router
		this.router.getRoute("edit")?.attachMatched(this.onObjectMatched);
	}

	// #region Lifecycle hook
	public override onExit(): void {
		this.router.getRoute("edit")?.detachMatched(this.onObjectMatched);
	}
	// #endregion

	// #region Router
	private onObjectMatched = (event: Route$MatchedEvent) => {
		const sectionModel = this.getModel("section");

		let requestId = "";

		try {
			const query = <Dict<string>>event.getParameter("arguments");
			requestId = query.requestId || "";
		} catch (error) {
			console.log(error);
		}

		sectionModel.setProperty("/requestId", requestId);

		this.getMetadataLoaded()
			.then(() => {
				this.onGetData();
			})
			.catch((error) => {
				console.error(error);
			})
			.finally(() => {
				this.setViewBusy(false);
			});
	};

	public onBackToWorkList() {
		const details = new Details("");
		details.onBackToWorkList(this.getRouter());
	}
	// #endregion

	// #region Busy state
	private setViewBusy(isBusy: boolean) {
		this.getModel("view").setProperty("/busy", isBusy);
	}
	// #endregion

	private onGetData() {
		const oDataModel = this.getModel<ODataModel>();
		const sectionModel = this.getModel("section");
		const formModel = this.getModel("form");

		const requestId = <string>sectionModel.getProperty("/requestId");

		this.setViewBusy(true);
		oDataModel.read("/LeaveRequestSet", {
			filters: [new Filter("RequestId", "EQ", requestId)],
			success: (response: ODataResponses<[LeaveRequest]>) => {
				const {
					LeaveType,
					StartDate,
					EndDate,
					Reason,
					EmployeeId,
					CreatedBy,
					CreatedOn,
					Status,
				} = response.results[0];

				sectionModel.setProperty("/EmployeeId", EmployeeId);
				sectionModel.setProperty("/CreatedBy", CreatedBy);
				sectionModel.setProperty("/CreatedOn", CreatedOn);
				sectionModel.setProperty("/Status", Status);

				formModel.setData(
					{
						LeaveType,
						StartDate: this.formatter.formatDate(StartDate, "yyyyMMdd"),
						EndDate: this.formatter.formatDate(EndDate, "yyyyMMdd"),
						Reason,
					},
					false
				);

				this.setViewBusy(false);
			},
			error: (error: ODataError) => {
				this.setViewBusy(false);
				console.log(error);
			},
		});
	}

	public onSaveDraftProcess() {
		const oDataModel = this.getModel<ODataModel>();
		const sectionModel = this.getModel("section");
		const formModel = this.getModel("form");

		const formData = <Dict<string>>formModel.getData();

		const requestId = <string>sectionModel.getProperty("/requestId");

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
		oDataModel.update(
			`/LeaveRequestSet('${requestId}')`,
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

					MessageToast.show("The draft has been saved");
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

					const sectionModel = this.getModel("section");
					const formModel = this.getModel("form");

					const formData = <Dict<string>>formModel.getData();

					const requestId = <string>sectionModel.getProperty("/requestId");

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
					oDataModel.update(
						`/LeaveRequestSet('${requestId}')`,
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
			// Kiểm tra tất cả các trường bắt buộc
			const controls = this.getControlsByFieldGroup<FormControl>({
				container: this.view,
				groupId: "FormField",
			});
			const isValid = this.validateControls(controls);

			// Nếu hợp lệ thì enable nút Send
			this.getModel("view").setProperty("/canSubmit", isValid);
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
