Ext.define('DIRAC.ActivityMonitor.classes.ActivityMonitor', {
	extend : 'Ext.dirac.core.Module',
	requires : [ 'Ext.util.*', 'Ext.panel.Panel', "Ext.form.field.Text", "Ext.button.Button", "Ext.menu.Menu", "Ext.form.field.ComboBox", "Ext.layout.*", "Ext.form.field.Date",
			"Ext.form.field.TextArea", "Ext.form.field.Checkbox", "Ext.form.FieldSet", "Ext.dirac.utils.DiracMultiSelect", "Ext.toolbar.Toolbar", "Ext.data.Record", 'Ext.Array', 'Ext.data.TreeStore',
			"Ext.ux.form.MultiSelect" ],

	initComponent : function() {

		var me = this;

		if (GLOBAL.VIEW_ID == "desktop") {

			me.launcher.title = "Activity Monitor";
			me.launcher.maximized = true;

		}

		if (GLOBAL.VIEW_ID == "tabs") {

		}

		Ext.apply(me, {
			layout : 'border',
			bodyBorder : false,
			defaults : {
				collapsible : true,
				split : true
			},
			items : [],
			header : false
		});

		me.callParent(arguments);

	},

	buildUI : function() {

		var me = this;

		me.mainPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			layout : 'card',
			region : "center",
			header : false,
			border : false,
			items : []
		});

		me.__buildPlotViewer();

		/*
		 * Only the delete handle of proxies is missing
		 */
		me.__buildActivityMonitor();
		me.__buildPlotManagement();

		me.add([ me.mainPanel ]);

	},

	__buildActivityMonitor : function() {

		var me = this;

		me.activityMonitorDataStore = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'ActivityMonitor/getActivityData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000
			},
			autoLoad : true,
			fields : [ {
				name : 'sources_id',
				type : 'int'
			}, 'sources_site', 'sources_componentType', 'sources_componentLocation', 'sources_componentName', {
				name : 'activities_id',
				type : 'int'
			}, 'activities_name', 'activities_category', 'activities_unit', 'activities_type', 'activities_description', {
				name : 'activities_bucketLength',
				type : 'int'
			}, 'activities_filename', {
				name : 'activities_lastUpdate',
				type : 'float'
			} ],
			remoteSort : true,
			pageSize : 100,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "info");

						if (parseInt(oStore.proxy.reader.rawData["total"], 10) == 0) {

							me.dataStore.removeAll();

						}

					}

				}

			}
		});

		var oDeleteSelectedActivities = new Ext.Button({
			text : "Delete",
			iconCls : "dirac-icon-delete",
			handler : function() {

			},
			tooltip : "Click to delete all selected proxies"
		});

		me.activityMonitorToolbar = Ext.create('Ext.toolbar.Paging', {
			store : me.activityMonitorDataStore,
			displayInfo : true,
			displayMsg : 'Displaying topics {0} - {1} of {2}',
			items : [ oDeleteSelectedActivities, "->" ],
			prependButtons : true,
			emptyMsg : "No topics to display",
			layout : {
				overflowHandler : 'Scroller'
			}
		});

		var sCheckboxDefinition = "";
		sCheckboxDefinition += '<input type="checkbox" value="" onchange="';
		sCheckboxDefinition += 'var oChecked=this.checked;';
		sCheckboxDefinition += 'var oElems=Ext.query(\'#' + me.id + ' input.checkrow\');';
		sCheckboxDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
		sCheckboxDefinition += '" class="am-main-check-box"/>';

		me.activityMonitorPanel = Ext.create('Ext.grid.Panel', {
			store : me.activityMonitorDataStore,
			header : false,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			columns : [ {
				header : sCheckboxDefinition,
				name : 'checkBox',
				width : 26,
				sortable : false,
				dataIndex : 'source_id',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.rendererChkBox(value);
				},
				hideable : false,
				fixed : true,
				menuDisabled : true,
				align : "center"
			}, {
				header : "Site",
				sortable : true,
				dataIndex : 'sources_site'
			}, {
				header : "Component Type",
				sortable : true,
				dataIndex : 'sources_componentType'
			}, {
				header : "Location",
				sortable : true,
				dataIndex : 'sources_componentLocation',
				flex : 1
			}, {
				header : "Component name",
				sortable : true,
				dataIndex : 'sources_componentName',
				flex : 1
			}, {
				header : "Activity name",
				sortable : true,
				dataIndex : 'activities_name'
			}, {
				header : "Category",
				sortable : true,
				dataIndex : 'activities_category'
			}, {
				header : "Unit",
				sortable : true,
				dataIndex : 'activities_unit'
			}, {
				header : "Activity type",
				sortable : true,
				dataIndex : 'activities_type'
			}, {
				header : "Description",
				sortable : true,
				dataIndex : 'activities_description'
			}, {
				header : "Bucket size",
				sortable : true,
				dataIndex : 'activities_bucketLength'
			}, {
				header : "File",
				sortable : true,
				dataIndex : 'activities_filename'
			}, {
				header : "Last update",
				sortable : true,
				dataIndex : 'activities_lastUpdate',
				renderer : function(value, metaData, record, row, col, store, gridView) {
					return this.renderLastUpdate(value, metaData, record, row, col, store, gridView);
				}
			} ],
			rendererChkBox : function(val) {
				return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
			},
			renderLastUpdate : function(value, metadata, record, rowIndex, colIndex, store) {
				var lastUpdated = record.data.activities_lastUpdate;
				var timeLimit = 86400 * 30;
				if (lastUpdated > timeLimit)
					lastUpdated = timeLimit;
				var green = parseInt(200 * (timeLimit - lastUpdated) / timeLimit);
				var red = parseInt(200 * (lastUpdated) / timeLimit);
				return '<span style="color: rgb(' + red + ',' + green + ',0);">' + lastUpdated + '</span>';
			},
			bbar : me.activityMonitorToolbar
		});

		me.mainPanel.add([ me.activityMonitorPanel ]);

	},

	__buildPlotManagement : function() {

		var me = this;

		me.plotManagementMainPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			layout : 'border',
			header : false,
			border : false,
			items : []
		});

		// the grid with the views

		me.plotManagementListStorePanel = new Ext.data.JsonStore({

			proxy : {
				type : 'ajax',
				url : GLOBAL.BASE_URL + 'ActivityMonitor/getViewsData',
				reader : {
					type : 'json',
					root : 'result'
				},
				timeout : 1800000
			},
			fields : [ "name" ],
			remoteSort : true,
			pageSize : 100,
			listeners : {

				load : function(oStore, records, successful, eOpts) {

					var bResponseOK = (oStore.proxy.reader.rawData["success"] == "true");

					if (!bResponseOK) {

						GLOBAL.APP.CF.alert(oStore.proxy.reader.rawData["error"], "info");

					}
				}

			}
		});

		me.plotManagementListPanel = Ext.create('Ext.grid.Panel', {
			region : "south",
			height : 300,
			store : me.plotManagementListStorePanel,
			header : false,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			columns : [ {
				header : "Name",
				sortable : true,
				dataIndex : 'name'
			} ]
		});

		// -------------------------------------------------------------------------------------

		var oTopPanel = new Ext.create('Ext.panel.Panel', {
			region : "top",
			floatable : false,
			layout : 'border',
			header : false,
			items : []
		});

		me.plotManagementFieldCreator = new Ext.create('Ext.panel.Panel', {
			region : "west",
			floatable : false,
			layout : 'anchor',
			header : false,
			width : 250,
			items : []
		});

		me.restrictByFieldCreator = Ext.create('Ext.form.field.ComboBox', {
			fieldLabel : "Restrict by",
			queryMode : 'local',
			labelAlign : 'left',
			displayField : "value",
			valueField : "value",
			anchor : '100%',
			editable : false
		});

		me.valuesFieldCreator = new Ext.ux.form.MultiSelect({
			fieldLabel : "Having values",
			queryMode : 'local',
			labelAlign : 'left',
			displayField : "value",
			valueField : "value",
			anchor : '100%',
			height : 150,
			store : new Ext.data.SimpleStore({
				fields : [ 'value' ],
				data : []
			}),
		});

		me.variableFieldCreator = Ext.create('Ext.form.field.Checkbox', {

			fieldLabel : "Variable field",
			labelAlign : "left"

		});

		me.plotManagementFieldCreator.add([ me.restrictByFieldCreator, me.valuesFieldCreator, me.variableFieldCreator ]);

		// -------------------------------------------------------------------------------------

		me.plotManagementViewOptions = new Ext.create('Ext.panel.Panel', {
			region : "east",
			floatable : false,
			layout : 'anchor',
			header : false,
			width : 250,
			items : []
		});

		me.checkGroupByViewOptions = new Ext.create("Ext.form.CheckboxGroup", {

			columns : 1,
			vertical : true,
			items : [ {
				boxLabel : 'Site',
				name : 'rb',
				inputValue : '1'
			}, {
				boxLabel : 'Component type',
				name : 'rb',
				inputValue : '2',
				checked : true
			}, {
				boxLabel : 'Component location',
				name : 'rb',
				inputValue : '3'
			}, {
				boxLabel : 'Component name',
				name : 'rb',
				inputValue : '4'
			}, {
				boxLabel : 'Activity',
				name : 'rb',
				inputValue : '5'
			}, {
				boxLabel : 'Activity category',
				name : 'rb',
				inputValue : '6'
			} ]

		});

		me.txtActivityLabelViewOptions = Ext.create('Ext.form.field.Text', {

			fieldLabel : "Activities label",
			labelAlign : "left",
			value : "$DESCRIPTION"

		});

		me.txtViewNameViewOptions = Ext.create('Ext.form.field.Text', {

			fieldLabel : "View name",
			labelAlign : "left"

		});

		me.txtStackActivityViewOptions = Ext.create('Ext.form.field.Checkbox', {

			fieldLabel : "Stack activities",
			labelAlign : "left"

		});

		me.plotManagementViewOptions.add([ {
			xtype : 'fieldset',
			columnWidth : 0.5,
			title : 'Group plots by',
			collapsible : true,
			items : [ me.checkGroupByViewOptions ]
		}, me.txtActivityLabelViewOptions, me.txtStackActivityViewOptions, me.txtViewNameViewOptions ]);

		// -------------------------------------------------------------------------------------

		me.plotManagementViewTreeStore = Ext.create('Ext.data.TreeStore', {
			proxy : {
				type : 'localstorage'
			},
			root : {
				text : 'View Definition'
			},
			listeners : {
				beforeexpand : function(oNode, eOpts) {

				}
			}
		});

		me.plotManagementViewTree = new Ext.create('Ext.tree.Panel', {
			region : 'center',
			store : me.plotManagementViewTreeStore,
			header : false
		});

		// -------------------------------------------------------------------------------------
		oTopPanel.add([ me.plotManagementFieldCreator, me.plotManagementViewOptions, me.plotManagementViewTree ]);
		me.plotManagementMainPanel.add([ me.plotManagementListPanel, oTopPanel ]);

		me.mainPanel.add(me.plotManagementMainPanel);

	},

	__buildPlotViewer : function() {

		var me = this;

		me.plotViewerMainPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			layout : 'border',
			header : false,
			border : false,
			defaults : {
				collapsible : true,
				split : true
			}
		});

		Ext.Ajax.request({
			url : GLOBAL.BASE_URL + 'ActivityMonitor/getStaticPlotViews',
			scope : me,
			success : function(response) {

				var me = this;
				var response = Ext.JSON.decode(response.responseText);

				me.plotViewerListPanel.reconfigure(new Ext.data.SimpleStore({
					fields : [ 'id', 'name', 'variable_fields' ],
					data : response.result
				}), undefined);
			}
		});

		me.plotViewerListPanel = Ext.create('Ext.grid.Panel', {
			region : "west",
			width : 250,
			store : null,
			header : false,
			viewConfig : {
				stripeRows : true,
				enableTextSelection : true
			},
			columns : [ {
				header : "Click on a view to plot it",
				sortable : true,
				dataIndex : 'name',
				flex : 1
			} ],
			listeners : {

				cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {

					me.plotViewerResultPanel.removeAll();

					var oNewPlots = me.__buildPlotView(record.get("name"), "");

					me.plotViewerResultPanel.add(oNewPlots);

				}

			}

		});

		me.plotViewerResultPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			region : "center",
			layout : "border",
			header : false,
			border : false,
			items : []
		});

		me.plotViewerMainPanel.add([ me.plotViewerListPanel, me.plotViewerResultPanel ]);
		me.mainPanel.add([ me.plotViewerMainPanel ]);

	},

	__buildPlotView : function(sViewId, sVariableData) {

		var me = this;

		var oMainPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			region : "center",
			layout : 'border',
			header : false,
			items : [],
			viewId : sViewId
		});

		var oLeftPanel = new Ext.create('Ext.panel.Panel', {
			title : "Activity view options",
			floatable : false,
			region : "west",
			layout : "anchor",
			width : 300,
			bodyPadding : 10,
			items : []
		});

		var oRightPanel = new Ext.create('Ext.panel.Panel', {
			floatable : false,
			region : "center",
			header : false,
			autoScroll : true,
			layout : {
				type : 'table',
				columns : 1
			}
		});

		var oCalenFrom = new Ext.create('Ext.form.field.Date', {
			width : 100,
			format : 'Y-m-d',
			fieldLabel : "From",
			labelAlign : "left",
			hidden : true,
			anchor : "100%"
		});

		var oCalenTo = new Ext.create('Ext.form.field.Date', {
			width : 100,
			format : 'Y-m-d',
			fieldLabel : "To",
			labelAlign : "left",
			hidden : true,
			anchor : "100%"
		});

		var oTimeSpan = new Ext.create('Ext.form.field.ComboBox', {
			labelAlign : 'left',
			fieldLabel : 'Time Span',
			editable : false,
			store : new Ext.data.SimpleStore({
				fields : [ 'value', 'text' ],
				data : [ [ 3600, "Last Hour" ], [ 86400, "Last Day" ], [ 604800, "Last Week" ], [ 2592000, "Last Month" ], [ -1, "Manual Selection" ] ]
			}),
			displayField : "text",
			valueField : "value",
			anchor : "100%",
			value : 86400,
			listeners : {
				change : function(field, newValue, oldValue, eOpts) {

					oCalenFrom.hide();
					oCalenTo.hide();

					switch (newValue) {

					case -1:
						oCalenFrom.show();
						oCalenTo.show();
						break;
					}

				}
			}
		});

		var oPlotSize = new Ext.create('Ext.form.field.ComboBox', {
			labelAlign : 'left',
			fieldLabel : 'Plot Size',
			editable : false,
			store : new Ext.data.SimpleStore({
				fields : [ 'value', 'text' ],
				data : [ [ 0, "Small" ], [ 1, "Medium" ], [ 2, "Big" ], [ 3, "Very Big" ] ]
			}),
			displayField : "text",
			valueField : "value",
			anchor : "100%",
			value : 1
		});

		oLeftPanel.add([ oTimeSpan, oCalenFrom, oCalenTo, oPlotSize ]);

		var oToolbar = new Ext.create('Ext.toolbar.Toolbar', {
			dock : 'bottom',
			border : false,
			layout : {
				pack : 'center'
			},
			items : []
		});

		var oSubmitBtn = new Ext.Button({

			text : 'Submit',
			margin : 3,
			iconCls : "dirac-icon-submit",
			handler : function() {

				var oParams = {};
				var bValid = true;

				oParams["id"] = sViewId;

				if (oTimeSpan.getValue() == -1) {

					if ((oCalenFrom.getValue() == null) || (Ext.util.Format.trim(oCalenFrom.getValue()) == "")) {
						GLOBAL.APP.CF.alert("Select a from date", "warning");
						bValid = false;
					}

					if ((oCalenTo.getValue() == null) || (Ext.util.Format.trim(oCalenTo.getValue()) == "")) {
						GLOBAL.APP.CF.alert("Select a to date", "warning");
						bValid = false;
					}

					oParams["timespan"] = -1;
					oParams["fromDate"] = oCalenFrom.getValue();
					oParams["toDate"] = oCalenTo.getValue();

				} else {

					oParams["timespan"] = oTimeSpan.getValue();

				}

				oParams["size"] = oPlotSize.getValue();

				if (bValid) {
					Ext.Ajax.request({
						url : GLOBAL.BASE_URL + 'ActivityMonitor/plotView',
						params : oParams,
						scope : me,
						success : function(response) {

							var me = this;
							var response = Ext.JSON.decode(response.responseText);

							if (response.success == "true") {

								var plotsList = response.data;
								if (plotsList.length) {

									oRightPanel.removeAll();

									for ( var i = 0; i < plotsList.length; i++) {

										var oNewImage = Ext.create('Ext.Img', {
											region : "center",
											src : GLOBAL.BASE_URL + "ActivityMonitor/getPlotImg?file=" + plotsList[i]
										});

										oRightPanel.add(oNewImage);

									}

								}

							} else {

								GLOBAL.APP.CF.alert(response.error, "warning");

							}
						}
					});
				}
			}
		});

		var oResetBtn = new Ext.Button({

			text : 'Reset',
			margin : 3,
			iconCls : "dirac-icon-reset",
			handler : function() {
			}
		});

		oToolbar.add([ oSubmitBtn, oResetBtn ]);

		oLeftPanel.addDocked([ oToolbar ]);

		oMainPanel.add([ oLeftPanel, oRightPanel ]);

		return oMainPanel;

	}

});
