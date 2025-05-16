import BaseController from "./Base.controller";

/**
 * @namespace myapp.ui5.controller
 */
export default class WorkList extends BaseController {
	public override onInit(): void {}

	public onPressed() {
		this.getRouter().navTo("RouteMain");
	}
}
