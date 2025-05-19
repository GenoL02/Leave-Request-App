import xorBy from "lodash.xorby";
import type { ExcelColumn } from "../types/export";
import type { ODataError, ODataResponses } from "../types/odata";
import type { LeaveRequest } from "../types/pages/main";
import type { Dict } from "../types/utils";
import type Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type View from "sap/ui/core/mvc/View";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type Router from "sap/ui/core/routing/Router";
import { EdmType } from "sap/ui/export/library";
import Spreadsheet from "sap/ui/export/Spreadsheet";
import Filter from "sap/ui/model/Filter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type Row from "sap/ui/table/Row";
import type { RowActionItem$PressEvent } from "sap/ui/table/RowActionItem";
import type Table from "sap/ui/table/Table";
import type { Table$RowSelectionChangeEvent } from "sap/ui/table/Table";
import BaseController from "./Base.controller";
import { table } from "sap/m/library";

/**
 * @namespace myapp.ui5.controller
 */

export default class Approve extends BaseController {
	private view: View;
	private router: Router;
	private table: Table;

	public override onInit(): void {
		this.view = this.getView();
		this.router = this.getRouter();
		this.table = this.getControlById<Table>("table");

		this.setModel(
			new JSONModel({
				rows: [],
				selectedRows: [],
				selectedIndices: [],
				columns: {},
				busy: false,
			}),
			"table"
		);

		this.setModel(
			new JSONModel({
				busy: true,
				delay: this.view.getBusyIndicatorDelay(),
			}),
			"view"
		);

		// Router
		this.router.getRoute("approve")?.attachMatched(this.onObjectMatched);
	}
	// #region Lifecycle hook
	public override onExit(): void {
		this.router.getRoute("approve")?.detachMatched(this.onObjectMatched);
	}
	// #endregion

	// #region Router
	private onObjectMatched = (event: Route$MatchedEvent) => {
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

	public onBackToList() {
		this.getRouter().navTo("RouteMain");
	}
	// #endregion

	// #region Busy state
	private setViewBusy(isBusy: boolean) {
		this.getModel("view").setProperty("/busy", isBusy);
	}
	// #endregion

	private onGetData() {
		const oDataModel = this.getModel<ODataModel>();

		const tableModel = this.getModel("table");

		this.setViewBusy(true);
		oDataModel.read("/ApproveRequestSet", {
			filters: [new Filter("User", "EQ", "KIENPV")],
			success: (response: ODataResponses<LeaveRequest[]>) => {
				tableModel.setProperty("/rows", response.results);
				this.setViewBusy(false);
			},
			error: (error: ODataError) => {
				console.log(error);
				this.setViewBusy(false);
			},
		});
	}

	// #region Table
	public onRowSelectionChange(event: Table$RowSelectionChangeEvent) {
		const tableModel = this.getModel("table");
		const rows = <LeaveRequest[]>tableModel.getProperty("/rows");

		const prevSelectedRows = <LeaveRequest[]>(
			tableModel.getProperty("/selectedRows")
		);
		const selectedRow = <LeaveRequest>(
			event.getParameter("rowContext")?.getObject()
		);
		const selectAll = event.getParameter("selectAll");
		const indices = this.table.getSelectedIndices();

		tableModel.setProperty("/selectedIndices", [...indices]);

		if (selectAll) {
			tableModel.setProperty("/selectedRows", rows);
		} else if (!selectedRow || !indices.length) {
			tableModel.setProperty("/selectedRows", []);
		} else {
			// const nextRows = xorBy(prevSelectedRows, [selectedRow], (item) => item.Employeeid); // MultiToggle
			const nextRows = xorBy(
				prevSelectedRows,
				[selectedRow],
				(item) => item.RequestId
			).slice(-1); // Single

			tableModel.setProperty("/selectedRows", nextRows);
		}
	}

	public onApproveProcess() {
		MessageBox.confirm("Do you want to approve this request?", {
			actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.OK,
			onClose: (action: unknown) => {
				if (action === MessageBox.Action.OK) {
					const oDataModel = this.getModel<ODataModel>();
					const selectedRows = <LeaveRequest[]>(
						this.getModel("table").getProperty("/selectedRows")
					);

					const item = selectedRows[0];

					this.setViewBusy(true);
					oDataModel.create(
						"/ApproveRequestSet",
						{
							...item,
							requestId: item.RequestId,
							action: "Approve",
						},
						{
							success: (response: ODataResponses<LeaveRequest[]>) => {
								this.setViewBusy(false);
								MessageToast.show("Request has been approved");
								this.onGetData();
								console.log(response);
							},
							error: (error: ODataError) => {
								this.setViewBusy(false);
								console.error(error);
							},
						}
					);
				}
			},
		});
	}

	public onRejectProcess() {
		MessageBox.confirm("Do you want to reject this request?", {
			title: "comfirmation",
			actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.OK,
			onClose: (action: unknown) => {
				if (action === MessageBox.Action.OK) {
					const oDataModel = this.getModel<ODataModel>();
					const selectedRows = <LeaveRequest[]>(
						this.getModel("table").getProperty("/selectedRows")
					);
					const item = selectedRows[0];
					this.setViewBusy(true);
					oDataModel.create(
						"/ApproveRequestSet",
						{
							...item,
							RequestId: item.RequestId,
							action: "Reject",
						},
						{
							success: (response: ODataResponses<LeaveRequest>) => {
								this.setViewBusy(false);
								MessageToast.show("Request has been rejected");
								this.onGetData();
								console.log(response);
							},
							error: (error: ODataError) => {
								this.setViewBusy(false);
								console.error(error);
							},
						}
					);
				}
			},
		});
	}
	public onApproveRequest(event: RowActionItem$PressEvent) {
		MessageBox.confirm("Do you want to approve this request?", {
			actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.OK,
			onClose: (action: unknown) => {
				if (action === MessageBox.Action.OK) {
					const oDataModel = this.getModel<ODataModel>();

					const row = event.getParameter("row");

					const item = <LeaveRequest>(
						row.getBindingContext("table")?.getObject()
					);

					this.setViewBusy(true);
					oDataModel.create(
						"/ApproveRequestSet",
						{
							...item,
							RequestId: item.RequestId,
							Action: "Approve",
						},
						{
							success: (response: ODataResponses<LeaveRequest>) => {
								this.setViewBusy(false);

								MessageToast.show("Request has been approved");
								this.onGetData();
								console.log(response);
							},
							error: (error: ODataError) => {
								this.setViewBusy(false);
								console.error(error);
							},
						}
					);
				}
			},
		});
	}
	public onRejectRequest(event: RowActionItem$PressEvent) {
		MessageBox.error("Do you want to reject this request?", {
			title: "Confirmation",
			actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.OK,
			onClose: (action: unknown) => {
				if (action === MessageBox.Action.OK) {
					const oDataModel = this.getModel<ODataModel>();

					const row = event.getParameter("row");

					const item = <LeaveRequest>(
						row.getBindingContext("table")?.getObject()
					);

					this.setViewBusy(true);
					oDataModel.create(
						"/ApproveRequestSet",
						{
							...item,
							RequestId: item.RequestId,
							Action: "Reject",
						},
						{
							success: (response: ODataResponses<LeaveRequest>) => {
								this.setViewBusy(false);

								MessageToast.show("Request has been rejected");
								this.onGetData();
								console.log(response);
							},
							error: (error: ODataError) => {
								this.setViewBusy(false);
								console.error(error);
							},
						}
					);
				}
			},
		});
	}
	// #endregion

	// #region Export
	public async onExportExcel() {
		const rows = <LeaveRequest[]>this.getModel("table").getProperty("/rows");

		if (!rows.length) {
			MessageToast.show("No data to export");
			return;
		}

		// Format data
		const dataSource = rows.map((item) => {
			return Object.keys(item).reduce<Dict>((acc, key) => {
				const value = item[key as keyof LeaveRequest];

				switch (key) {
					case "__metadata": {
						break;
					}
					// case "LeaveType": {
					//   acc[key] = value + " XXX";
					//   break;
					// }
					default: {
						acc[key] = value;
						break;
					}
				}
				return acc;
			}, {});
		});

		const columns = this.table
			.getColumns()
			.filter((column) => {
				return ![""].includes(this.getControlId(column));
			})
			.map<ExcelColumn>((column) => {
				const columnId = this.getControlId(column);
				const label = (<Label>column.getLabel()).getText();
				const width = column.getWidth();

				switch (columnId) {
					case "StartDate":
					case "EndDate": {
						return {
							label,
							property: columnId,
							type: EdmType.DateTime,
							width,
						};
					}
					default: {
						return {
							label,
							property: columnId,
							type: EdmType.String,
							width,
						};
					}
				}
			});

		const sheet = new Spreadsheet({
			workbook: {
				columns,
				hierarchyLevel: "Level",
				context: {
					sheetName: "Leave Request",
				},
			},
			dataSource,
			fileName: `Leave_Request_Export_${this.formatter.dateNow()}`,
			worker: true,
		});

		try {
			await sheet.build();
		} catch (error) {
			MessageToast.show("An error occurred, please try again later");
			console.error(error);
		} finally {
			sheet.destroy();
		}
	}
	// #endregion
}
