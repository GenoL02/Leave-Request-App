import type Control from "sap/ui/core/Control";
import ControlMessageProcessor from "sap/ui/core/message/ControlMessageProcessor";
import MessageProcessor from "sap/ui/core/message/MessageProcessor";
import Messaging from "sap/ui/core/Messaging";
import View from "sap/ui/core/mvc/View";
import BaseComponent from "sap/ui/core/UIComponent";
import Device from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel";
// import { ErrorHandler } from "./controller/ErrorHandler";
// import { createDeviceModel } from "./model/models";

/**
 * @namespace myapp.ui5
 */
export default class Component extends BaseComponent {
	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"],
	};

	private MessageManager: Messaging;
	private MessageProcessor: MessageProcessor;
	// private ErrorHandler: ErrorHandler;

	/**
	 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
	 * @public
	 * @override
	 */
	public override init(): void {
		// call the base component's init function
		super.init();

		// messaging
		this.MessageManager = Messaging;
		this.MessageProcessor = new ControlMessageProcessor();
		this.MessageManager.registerMessageProcessor(this.MessageProcessor);

		// this.ErrorHandler = new ErrorHandler(this);

		this.setModel(this.MessageManager.getMessageModel(), "message");

		this.setModel(
			new JSONModel({
				MessageTitle: "",
				MessageDescription: "",
			}),
			"global"
		);

		// set the device model
		// this.setModel(createDeviceModel(), "device");

		// enable routing
		this.getRouter().initialize();
	}

	public override createContent(): Control | Promise<Control | null> | null {
		const appView = View.create({
			viewName: "myapp.ui5.view.App",
			type: "XML",
			viewData: { component: this },
		});

		appView
			.then((view) => {
				view.addStyleClass(this.getContentDensityClass());
			})
			.catch((error) => {
				console.log(error);
			});

		return appView;
	}

	public getErrorHandler() {
		// return this.ErrorHandler;
	}

	public getMessageManager() {
		return this.MessageManager;
	}

	public getMessageProcessor() {
		return this.MessageProcessor;
	}

	public getContentDensityClass(): string {
		return Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";
	}
}
