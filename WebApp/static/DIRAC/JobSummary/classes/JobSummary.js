Ext.define("DIRAC.JobSummary.classes.JobSummary", {
      extend : 'Ext.dirac.core.Module',
      requires : ["Ext.dirac.utils.DiracBaseSelector", "Ext.dirac.utils.DiracJsonStore", "Ext.dirac.utils.DiracAjaxProxy", "Ext.dirac.utils.DiracPagingToolbar", 'Ext.dirac.utils.DiracToolButton', "Ext.dirac.utils.DiracApplicationContextMenu", "Ext.dirac.utils.DiracGridPanel"],
      loadState : function(data) {
        var me = this;

        me.grid.loadState(data);

        me.leftPanel.loadState(data);
      },
      getStateData : function() {
        var me = this;

        var oStates = {
          grid : me.grid.getStateData(),
          leftMenu : me.leftPanel.getStateData()
        };

        return oStates;
      },

      dataFields : [{
            name : 'GridType'
          }, {
            name : 'Site'
          }, {
            name : 'Country'
          }, {
            name : 'MaskStatus'
          }, {
            name : 'Received',
            type : 'int'
          }, {
            name : 'Checking',
            type : 'int'
          }, {
            name : 'Staging',
            type : 'int'
          }, {
            name : 'Waiting',
            type : 'int'
          }, {
            name : 'Matched',
            type : 'int'
          }, {
            name : 'Running',
            type : 'int'
          }, {
            name : 'Stalled',
            type : 'int'
          }, {
            name : 'Done',
            type : 'int'
          }, {
            name : 'Completed',
            type : 'int'
          }, {
            name : 'Failed',
            type : 'int'
          }, {
            name : 'Efficiency'
          }, {
            name : 'Status'
          }, {
            name : 'Tier'
          }, {
            name : 'FullCountry'
          }, {
            name : 'MaskStatusIcon',
            mapping : 'MaskStatus'
          }, {
            name : 'SiteCheckbox',
            mapping : 'Site'
          }, {
            name : 'StatusIcon',
            mapping : 'Status'
          }],

      initComponent : function() {
        var me = this;

        me.launcher.title = "Job Summary";
        me.launcher.maximized = false;

        if (GLOBAL.VIEW_ID == "desktop") {

          var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

          me.launcher.width = oDimensions[0];
          me.launcher.height = oDimensions[1];

          me.launcher.x = 0;
          me.launcher.y = 0;

        }

        Ext.apply(me, {
              layout : 'border',
              bodyBorder : false,
              defaults : {
                collapsible : true,
                split : true
              }
            });

        me.callParent(arguments);

      },
      buildUI : function() {

        var me = this;

        var selectors = {
          status : "Status",
          gridtype : "GridType",
          maskstatus : "MaskStatus",
          country : "Country"
        };

        var map = [["status", "status"], ["gridtype", "gridtype"], ["maskstatus", "maskstatus"], ["country", "country"]];

        me.leftPanel = new Ext.create('Ext.dirac.utils.DiracBaseSelector', {
              scope : me,
              cmbSelectors : selectors,
              datamap : map,
              hasTimeSearchPanel : false,
              url : "JobSummary/getSelectionData"
            });

        /*
         * -----------------------------------------------------------------------------------------------------------
         * DEFINITION OF THE GRID
         * -----------------------------------------------------------------------------------------------------------
         */
        var oProxy = Ext.create('Ext.dirac.utils.DiracAjaxProxy', {
              url : GLOBAL.BASE_URL + 'SiteSummary/getSiteSummaryData'
            });

        me.dataStore = Ext.create("Ext.dirac.utils.DiracJsonStore", {
              proxy : oProxy,
              fields : me.dataFields,
              scope : me
            });

        var pagingToolbar = Ext.create("Ext.dirac.utils.DiracPagingToolbar", {
              store : me.dataStore,
              scope : me,
              value : 100
            });

        var oColumns = {
          "Name" : {
            "dataIndex" : "Site",
            "properties" : {
              hidable : false
            }
          },
          "Tier" : {
            "dataIndex" : "Tier"
          },
          "GridType" : {
            "dataIndex" : "GridType"
          },
          "Country" : {
            "dataIndex" : "Country",
            "properties" : {
              hideable : true,
              ortable : true,
              align : 'left'
            },
            renderer : function flag(code) {
              return '<img src="' + GLOBAL.BASE_URL + 'static/core/img/flags/' + code + '.gif">';
            }
          },
          "None" : {
            "dataIndex" : "MaskStatusIcon",
            "properties" : {
              width : 26,
              sortable : false,
              hideable : false,
              fixed : true,
              menuDisabled : true
            },
            "renderFunction" : "rendererStatus"
          },
          "MaskStatus" : {
            "dataIndex" : "MaskStatus"
          },
          "None" : {
            "dataIndex" : "StatusIcon",
            "properties" : {
              width : 26,
              sortable : false,
              hideable : false,
              fixed : true,
              menuDisabled : true
            },
            "renderFunction" : "rendererStatus"
          },
          "Status" : {
            "dataIndex" : "Status"
          },
          "Efficiency (%)" : {
            "dataIndex" : "Efficiency"
          },
          "Received" : {
            "dataIndex" : "Received",
            "properties" : {
              hidden : true
            }
          },
          "Checking" : {
            "dataIndex" : "Checking",
            "properties" : {
              hidden : true
            }
          },
          "Staging" : {
            "dataIndex" : "Staging"
          },
          "Waiting" : {
            "dataIndex" : "Waiting",
            "properties" : {
              hidden : true
            }
          },
          "Matched" : {
            "dataIndex" : "Matched",
            "properties" : {
              hidden : true
            }
          },
          "Running" : {
            "dataIndex" : "Running"
          },
          "Completed" : {
            "dataIndex" : "Completed"
          },
          "Done" : {
            "dataIndex" : "Done"
          },
          "Stalled" : {
            "dataIndex" : "Stalled"
          },
          "Failed" : {
            "dataIndex" : "Failed"
          }
        };

        var sm = Ext.create('Ext.selection.CheckboxModel');
        me.grid = Ext.create('Ext.dirac.utils.DiracGridPanel', {
              selModel : sm,
              store : me.dataStore,
              columnLines : true,
              width : 600,
              height : 300,
              oColumns : oColumns,
              pagingToolbar : pagingToolbar,
              scope : me
            });

        me.leftPanel.setGrid(me.grid);

        me.add([me.leftPanel, me.grid]);

      }
    });