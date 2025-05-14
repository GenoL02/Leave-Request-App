import type { ODataError, ODataResponses } from "../types/odata";
import type { LeaveRequest } from "../types/pages/main";
import type { Dict } from "../types/utils";
import type View from "sap/ui/core/mvc/View";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type Router from "sap/ui/core/routing/Router";
import Filter from "sap/ui/model/Filter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BaseController from "./Base.controller";

/**
 * @namespace myapp.ui5.controller
 */

export default class Details extends BaseController {
	private view: View;
	private router: Router;

	public override onInit(): void {
		this.view = this.getView();
		this.router = this.getRouter();

		this.setModel(
			new JSONModel({
				busy: true,
				delay: this.view.getBusyIndicatorDelay(),
			}),
			"view"
		);

		this.setModel(
			new JSONModel({
				requestId: "",
				employeeId: "",
				CreatedBy: "",
				CreatedOn: "",
				Status: "",
			}),
			"section"
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

		// Router
		this.router.getRoute("details")?.attachMatched(this.onObjectMatched);
	}

	// #region Lifecycle Hook
	public override onExit(): void {
		this.router.getRoute("details")?.detachMatched(this.onObjectMatched);
	}

	// #endregion
	private onObjectMatched = (event: Route$MatchedEvent) => {
		const sectionModel = this.getModel("section");

		let requestId = "";

		try {
			const query = <Dict<string>>event.getParameter("arguments");
			requestId = query.requestId || "";
		} catch (error) {
			console.error(error);
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
		this.getRouter().navTo("RouteMain");
	}

	//endregion

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
			filters: [new Filter("requestId", "EQ", requestId)],
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
			},
		});
	}
}
