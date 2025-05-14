export default {
	name: "QUnit test suite for the UI5 Application: myapp.ui5",
	defaults: {
		page: "ui5://test-resources/myapp/ui5/Test.qunit.html?testsuite={suite}&test={name}",
		qunit: {
			version: 2
		},
		sinon: {
			version: 4
		},
		ui5: {
			language: "EN",
			theme: "sap_horizon"
		},
		coverage: {
			only: "myapp/ui5/",
			never: "test-resources/myapp/ui5/"
		},
		loader: {
			paths: {
				"myapp/ui5": "../"
			}
		}
	},
	tests: {
		"unit/unitTests": {
			title: "Unit tests for myapp.ui5"
		},
		"integration/opaTests": {
			title: "Integration tests for myapp.ui5"
		}
	}
};
