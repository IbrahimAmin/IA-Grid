(function() {
    var columnsOrderHtml = "<div class=\"dropdown pull-right ia-grid\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"order-dropdown\" data-toggle=\"dropdown\">Re-Order Columns<span class=\"caret\"></span></button><ul data-bind=\"foreach: columnsOrder, sortable: true\" class=\"dropdown-menu dropdown-menu-right\" id=\"order-dropdown-sortable\" aria-labelledby=\"order-dropdown\"><li><a href=\"#\" data-bind=\"text: label\"></a></li></ul></div>";

    var columnsGroupHtml = "<div class=\"dropdown pull-right\" style=\"margin-right: 15px\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"group-dropdown\" data-toggle=\"dropdown\">Group By<span class=\"caret\"></span></button><ul data-bind=\"foreach: columnsOrder\" class=\"dropdown-menu dropdown-menu-right\" aria-labelledby=\"order-dropdown\"><li><a href=\"#\"><div class=\"checkbox\"><label><input type=\"checkbox\" data-bind=\"checkedValue: field, checked: $parent.groups\"> <span data-bind=\"text: label\"></span></label></div></a></li></ul></div>";

    var columnsHiddenHtml = "<div class=\"dropdown pull-right\" style=\"margin-right: 15px\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"hidden-dropdown\" data-toggle=\"dropdown\">Show / Hide<span class=\"caret\"></span></button><ul data-bind=\"foreach: columnsOrder\" class=\"dropdown-menu dropdown-menu-right\" aria-labelledby=\"order-dropdown\"><li><a href=\"#\"><div class=\"checkbox\"><label><input type=\"checkbox\" data-bind=\"checkedValue: field, checked: $parent.hiddenColumns\"> <span data-bind=\"text: label\"></span></label></div></a></li></ul></div>";

    var defaultTableHtml = "<!--ko if: (groupedList().length < 1)--><table data-resizable-columns-id=\"ia-grid\" class=\"table table-bordered ia-grid\"><thead><tr data-bind=\"foreach: columnsOrder\"><th data-bind=\"text: label, attr: {'data-resizable-column-id': 'resz-' + field}, visible: ($root.hiddenColumns().indexOf(field) === -1)\"></th></tr></thead><tbody data-bind=\"foreach: {data: gridData, afterRender: updateResizable}\"><tr data-bind=\"foreach: $parent.columnsOrder\"><td data-bind=\"text: $parent[field], attr: {'data-title': label}, visible: ($root.hiddenColumns().indexOf(field) === -1)\"></td></tr></tbody></table><!--/ko-->";

    var groupedTableHtml = "<!--ko if: (groupedList().length > 0)--><div class=\"cards-container\" data-bind=\"foreach: groupedList, css: {'card-selected': cardSelected()}\"><div class=\"card\" data-bind=\"attr: { id: 'card-' + $index() }, css: { selected: ($parent.cardSelected() === ('card-' + $index())) }\"><div class=\"card-content\"><div class=\"card-info\"><table class=\"table card-table\" data-bind=\"foreach: $parent.groups\"><tr><td class=\"group-label\" data-bind=\"text: $root.labels[$data]\"></td><td class=\"group-value\" data-bind=\"text: $parent[$data]\"></td></tr></table></div><div class=\"card-data\"><div data-bind=\"click: $root.toggleCardSelected.bind($data, '')\" class=\"close-group pull-right\"> <i class=\"fa fa-2x fa-close\"> </i></div><table data-bind=\"attr: {'data-resizable-columns-id': 'ia-table-' + $index()}\" class=\"table table-bordered ia-grid\"><thead><tr data-bind=\"foreach: $root.columnsOrder\"><th data-bind=\"text: label, attr: {'data-resizable-column-id': 'resz-' + field}, visible: ($root.hiddenColumns().indexOf(field) === -1)\"></th></tr></thead><tbody data-bind=\"foreach: {data: list, afterRender: $root.updateResizable}\"><tr data-bind=\"foreach: $root.columnsOrder\"><td data-bind=\"text: $parent[field], attr: {'data-title': label}, visible: ($root.hiddenColumns().indexOf(field) === -1)\"></td></tr></tbody></table></div></div><div class=\"card-action\"><a href='#' data-bind=\"text: groupTitle, click: $root.toggleCardSelected.bind($data, 'card-' + $index())\"></a></div></div></div><!--/ko-->";

    var updateResizable = function(e, val) {
        $("table.ia-grid").resizableColumns('destroy');

        setTimeout(function() {
            $("table.ia-grid").resizableColumns({
                store: store
            });
        }, 1000);
    };

    var groups = ko.observableArray([]);

    var columnsOrder = ko.observableArray([]);

    var hiddenColumns = ko.observableArray([]);

    var labels = ko.observable({});

    var groupedList = ko.observableArray([]);

    var gridData = ko.observableArray([]);

    var groupBy = function() {
        if (groups().length) {
            var keyedList = _.groupBy(gridData(), function(data) {
                var compositeKey = "";

                groups().forEach(function(group) {
                    compositeKey += data[group];
                });

                return compositeKey;
            });

            groupedList(_.map(keyedList, function(keyed) {
                var grouped = {};

                groups().forEach(function(group) {
                    grouped[group] = keyed[0][group];
                });

                grouped.groupTitle = keyed[0][groups()[0]];

                grouped.list = keyed;

                return grouped;
            }));
        } else {
            cardSelected("");
            groupedList([]);
        }
    };

    var cardSelected = ko.observable("");

    var toggleCardSelected = function(card) {
        cardSelected(card);
        updateResizable();
    };

    ko.bindingHandlers.sortable = {
        init: function(element, valueAccessor, allBindingsAccesor, context) {
            var $element = $(element),
                list = allBindingsAccesor().foreach;

            $element.sortable({
                revert: true,
                update: function(event, ui) {
                    var currentList = list();

                    var item = ko.dataFor(ui.item[0]);

                    var itemNodes = $(ui.item[0]).parent().children();

                    var newIndex = ko.utils.arrayIndexOf(itemNodes, ui.item[0]);

                    ko.utils.arrayRemoveItem(currentList, item);

                    currentList.splice(newIndex, 0, item);

                    list(currentList);
                }
            });
        }
    };

    ko.bindingHandlers['iaGrid'] = {
        init: function(element, valueAccessor) {
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);

            var savedGroup = localStorage.getItem("iagrid-columns-group-" + element.id) ? JSON.parse(localStorage.getItem("iagrid-columns-group-" + element.id)) : null;
            var savedOrder = localStorage.getItem("iagrid-columns-order-" + element.id) ? JSON.parse(localStorage.getItem("iagrid-columns-order-" + element.id)) : null;
            var savedHidden = localStorage.getItem("iagrid-columns-hidden-" + element.id) ? JSON.parse(localStorage.getItem("iagrid-columns-hidden-" + element.id)) : null;

            hiddenColumns(savedHidden || valueUnwrapped.hiddenColumns());
            groups(savedGroup || valueUnwrapped.groups());
            columnsOrder(savedOrder || valueUnwrapped.columnsOrder());
            labels(valueUnwrapped.labels);

            groups.subscribe(function(value) {
                localStorage.setItem("iagrid-columns-group-" + element.id, JSON.stringify(value));
                groupBy();
            });

            hiddenColumns.subscribe(function(value) {
                localStorage.setItem("iagrid-columns-hidden-" + element.id, JSON.stringify(value));
                updateResizable();
            });

            columnsOrder.subscribe(function(value) {
                localStorage.setItem("iagrid-columns-order-" + element.id, JSON.stringify(value));
            });

            return {
                controlsDescendantBindings: true
            };
        },
        'update': function(element, valueAccessor) {
            ko.applyBindingsToNode(element, {
                html: '<div class="ia-grid">' + columnsOrderHtml + columnsGroupHtml + columnsHiddenHtml + defaultTableHtml + groupedTableHtml + '</div>'
            });

            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);

            gridData(valueUnwrapped.data());

            if (groups().length) {
                groupBy();
            }

            var gridModel = {
                gridData: gridData,
                columnsOrder: columnsOrder,
                updateResizable: updateResizable,
                groupedList: groupedList,
                groups: groups,
                labels: labels(),
                hiddenColumns: hiddenColumns,
                cardSelected: cardSelected,
                toggleCardSelected: toggleCardSelected
            };

            ko.applyBindingsToDescendants(gridModel, element);
        }
    };
})();