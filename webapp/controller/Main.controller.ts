import xorBy from "lodash.xorby";
import type { ExcelColumn } from "../types/export";
import type { ODataError, ODataResponses } from "../types/odata";
import type { LeaveRequest } from "../types/pages/main";
import type { Dict } from "../types/utils";
import type Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import type { ObjectIdentifier$TitlePressEvent } from "sap/m/ObjectIdentifier";
import type View from "sap/ui/core/mvc/View";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type Router from "sap/ui/core/routing/Router";
import { EdmType } from "sap/ui/export/library";
import Spreadsheet from "sap/ui/export/Spreadsheet";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
// import type Row from "sap/ui/table/Row";
import type { RowActionItem$PressEvent } from "sap/ui/table/RowActionItem";
import type Table from "sap/ui/table/Table";
import type { Table$RowSelectionChangeEvent } from "sap/ui/table/Table";
import BaseController from "./Base.controller";

/**
 * @namespace myapp.ui5.controller
 */
export default class Main extends BaseController {
	private view: View;
	private router: Router;
	private table: Table;

	public override onInit(): void {
		this.view = this.getView();
		this.router = this.getRouter();
		this.table = this.getControlById("table");
		this.setModel(
			new JSONModel({
				busy: true,
				delay: this.view.getBusyIndicatorDelay(),
			}),
			"view"
		);
		this.setModel(
			new JSONModel({
				row: [],
				selectedRows: [],
				selectedIndices: [],
				columns: {},
				busy: false,
			}),
			"table"
		);
		// Router
		this.router.getRoute("RouteMain")?.attachMatched(this.onObjectMatched);
	}
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
		oDataModel.read("/LeaveRequestSet", {
			success: (response: ODataResponses<LeaveRequest[]>) => {
				console.log(response);
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

	public onNavigateToCreateRequest() {
		this.getRouter().navTo("create");
	}

	public onNavigateToEditRequest(event: RowActionItem$PressEvent) {
		const row = event.getParameter("row");
		const requestId = <string>(
			row.getBindingContext("table")?.getProperty("RequestId")
		);

		this.getRouter().navTo("edit", {
			requestId,
		});
	}

	public onNavigateToDetails(event: ObjectIdentifier$TitlePressEvent) {
		const control = event.getSource();
		const requestId = <string>(
			control.getBindingContext("table")?.getProperty("RequestId")
		);

		this.getRouter().navTo("details", {
			requestId,
		});
	}

	public onDeleteRequest(event: RowActionItem$PressEvent) {
		const oDataModel = this.getModel<ODataModel>();

		const row = event.getParameter("row");

		const item = <LeaveRequest>row.getBindingContext("table")?.getObject();

		MessageBox.confirm("Do you want to delete this request?", {
			actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.DELETE,
			onClose: (action: unknown) => {
				if (action === MessageBox.Action.DELETE) {
					const key = oDataModel.createKey("/LeaveRequestSet", item);
					// `/LeaveRequestSet('${item.RequestId}')`

					oDataModel.remove(key, {
						success: () => {
							MessageToast.show("Request was successfully deleted");

							this.onGetData();
						},
						error: () => {
							MessageToast.show("An error occurred, please try again later");
						},
					});
				}
			},
		});
	}

	public onDeleteRequests() {
		const oDataModel = this.getModel<ODataModel>();

		const selectedRows = <LeaveRequest[]>(
			this.getModel("table").getProperty("/selectedRows")
		);

		const item = selectedRows[0];

		MessageBox.confirm("Do you want to delete this request?", {
			actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.DELETE,
			onClose: (action: unknown) => {
				if (action === MessageBox.Action.DELETE) {
					const key = oDataModel.createKey("/LeaveRequestSet", item);

					oDataModel.remove(key, {
						success: () => {
							MessageToast.show("Request was successfully deleted");

							this.onGetData();
						},
						error: () => {
							MessageToast.show("An error occurred, please try again later");
						},
					});
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
							type: EdmType.Date,
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
		} finally {
			sheet.destroy();
		}
	}
	// #endregion
}
