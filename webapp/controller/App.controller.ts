import type View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./Base.controller";

/**
 * @namespace myapp.ui5.controller
 */
export default class App extends BaseController {
	private view: View;

	public override onInit(): void {
		this.view = this.getView();
		const originalBusyDelay = this.view.getBusyIndicatorDelay();
		this.setModel(
			new JSONModel({
				busy: true,
				delay: 0,
			}),
			"appView"
		);
		const metadataLoadedHandler = (isFailed: boolean) => {
			const viewModel = this.getModel("appView");
			viewModel.setProperty("/busy", false);
			viewModel.setProperty("/delay", originalBusyDelay);
		};
		// disable busy indication when the metadata is loaded and in case of errors
		this.getComponentModel()
			?.metadataLoaded()
			.then(metadataLoadedHandler.bind(this, false))
			.catch((error) => {
				console.log(error);
			});
		this.getComponentModel()?.attachMetadataFailed(
			metadataLoadedHandler.bind(this, true)
		);
		// apply content density mode to root view
		this.view.addStyleClass(this.getComponent().getContentDensityClass());
	}
}
