/* eslint-disable security/detect-object-injection */
/* eslint-disable no-underscore-dangle */
/********************************************************************************
 * USICTableComponent (lib-usic-table)
 *
 * Angular component to render a table of data with some common enhancements
 * such as column based filtering.
 *
 * parameters
 * INPUT
 *   displayedColumns   : array of UsicTableColumn objects used to dynamically
 *                        build table column header
 *
 *                        Here are some special options for cell values:
 *                        To enable selectable rows add:
 *                        { name: 'select', type: 'boolean' },
 *                        To enable delete row add:
 *                        { name: 'delete', type: 'icon', icon: 'delete' }
 *                        To add a custom action icon, add something like:
 *                        { name: 'username', title: 'Become', type: 'icon', icon: 'face', clickFn: this.become.bind(this) }
 *                         where the attribute value of the name will be the value passed to the clickFn
 *                         become(event, username) { ... }
 *                        To make the value be a link to another page add (up to 3 id values supported):
 *                        { name: 'ticketNumber', title: 'Ticket #', type: 'string',
 *                          linkRoute: '/ticket/details', linkId: 'ticketId', linkId2: 'locateId' },
 *                        To make the cell contents be a component:
 *                        { name: 'schedulerJobStatus.code', type: 'component', title: 'Job Status',
 *                          component: this.changeStatusComponent },
 *                        To show a particular value in an array of values:
 *                        { name: 'profileValues{_profileLevelId:1}.value', title: 'User Value', type: 'string' }
 *                          where it finds from the array of profileValues, the one that has profileLevelId = 1,
 *                          then displays that item's value.
 *
 *   data               : observable for an array of data object to display in the
 *                        table.  Attributes of the objects should correspond to
 *                       the column names.
 *   - or -
 *   jsonApiDataSource  : DataSource connected to a JSON:API to dynamically
 *                        retrieve data for the table
 *
 *   dataSourceLoading  : boolean to indicate if the loading indicator should be
 *                        turned on.  Normally this is handled automatically by the
 *                        USIC table component, but this allows some external control
 *
 *   filtering          : string indicating type of filtering to provide.
 *                        none     : no filtering added
 *                        'global' : a single filter field is provided to filter
 *                                   across all data in the table
 *                        'column' : filter fields are added to each column header
 *
 *   expandFilters      : boolean to indicate if filters section should be shown
 *   provideExcelExport : boolean to indicate if the button to provide download
 *                        of table data as an Excel file should be shown
 *   selectByKey        : string - a column name to be used for external row
 *                        selection notifications
 *   selectByValue      : Observable<any> - a column value to indicate which
 *                        row value to match for an external selection
 *   prefix             : string - prefix to save setting with to distinguish
 *                        which table these settings are for. Usually this is
 *                        the containing component selector
 *   pageSize           : initial page size (default 5)
 *   customWidth        : string - used to override default table width of 100%
 *   allowNew           : boolean to indicate if the button to create a new record should be shown
 *   selectedActions    : array of actions for selected rows { name: string; icon: string; action: any; enabled: boolean; class?: string }
 *   persistColumns     : boolean indicating if columns settings should be saved and restored (default true)
 *   cancelRefresh      : boolean used to cancel refreshing of jsonApiDataSource when closing an edit dialog
 *   printPreview       : boolean used for print styling
 *   tableClass         : string used to add an optional class to the table for use with custom styling
 *   editComponent      : component to use to open the edit dialog
 *
 * OUTPUT
 *   changePage         : EventEmitter to send MatPaginator page events to
 *   changeSort         : EventEmitter to send MatSort sort events to
 *   openDialog         : EventEmitter to send opened dialog MatDialogRef to
 *   clickCell          : EventEmitter to notify which a table cell is clicked
 *   clickRow           : EventEmitter to notify which a table row is clicked
 *   dblClickRow        : EventEmitter to notify which a table row is double clicked
 *   createNew          : EventEmitter to notify when the Add New button is clicked
 *   deleteRecord       : EventEmitter to notify which record to delete
 *   changeColumns      : EventEmitter to nofify when columns change (hide/show, reoder)
 *   cancelClicked      : EventEmitter to notify when the "Loading" indicator is clicked
 *   selection          : SelectionModel of selected rows
 *   refreshData        : EventEmitter to enable a custom data refresh method to be used
 *   rowClasses         : EventEmitter to enable custom row classes
 *
 * TWO-WAY [(Banana in a Box)]
 *   selectedRows       : Array of selected rows
 *
 * author: Steven Pothoven (stevenpothoven@usicllc.com)
 ********************************************************************************/

import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  ViewChild,
  EventEmitter,
  ChangeDetectorRef,
  OnDestroy,
  ElementRef,
  RendererFactory2,
  Renderer2,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { UntypedFormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { MediaMatcher } from '@angular/cdk/layout';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CommonModule } from '@angular/common';  // needed for async pipe

import { UsicTableColumn } from '../../models/general';
import { JsonAPIDataSource } from '../../datasources/jsonapi.datasource';
import { ResolvePipe } from '../../pipes/resolve.pipe';
import { SelectionModel } from '@angular/cdk/collections';
import { PersistentSettingsService } from '../../services/persistent-settings.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ExcelOptions, MatTableExporterDirective, Options } from 'mat-table-exporter';
import { ClipboardService } from '../../services/clipboard.service';
import { deepAssign } from '../../helpers/deep-assign';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComponentType } from '@angular/cdk/portal';
import { UsicTableResizeComponent } from './usic-table-resize/usic-table-resize.component';
import { HttpClient } from '@angular/common/http';
import { JsonApiModelService } from '../../services/json-api-model.service';
import { CellEditorComponent } from './usic-table-components/cell-editor/cell-editor.component';
import { JsonApiModel } from '@michalkotas/angular2-jsonapi';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-usic-table',
  templateUrl: './usic-table.component.html',
  styleUrls: ['./usic-table.component.scss'],
  providers: [ResolvePipe],
})
export class UsicTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  get self(): UsicTableComponent {
    return this;
  }

  @Input() displayedColumns: UsicTableColumn[] = [];
  @Input() filtering: string;  // type of filtering to provide (global, column)
  @Input() expandFilters: boolean;  // show filters section?
  @Input() provideExcelExport = false;
  @Input() selectByKey: string;
  @Input() selectByValue: Observable<any>;
  @Input() prefix: string;
  @Input() allowNew: boolean;
  @Input() createButtonText: string;
  @Input() selectedActions: { name: string; icon: string; action: any; enabled: boolean; class?: string }[] = [];
  @Input() persistColumns = true;
  @Input() tableClass = 'usic-table';
  @Input() printPreview: boolean | undefined;
  @Input() editComponent;

  // When a static set of data is provided
  @Input() data: Observable<any[]>;
  @Input() totaledColumns: { name: string; total: number }[] = [];

  // When a dynamic DataSource is provided
  @Input() jsonApiDataSource: JsonAPIDataSource;
  @Input() dataSourceLoading = false;

  // used to build the menu that shows which rows are selected when cumulativeSelections is true
  @Input() cumulativeSelectionsKeys: { name: string; label: string }[] = [
    // { name: '_serialNumber', label: 'Serial Number'},
    // { name: '_usicTag', label: 'Usic Tag'}
  ];

  @Input() pageSize = 5;
  @Input() customWidth: string;

  @Output() changePage: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  @Output() changeSort: EventEmitter<Sort> = new EventEmitter<Sort>();
  @Output() openDialog: EventEmitter<MatDialogRef<ComponentType<any>>> = new EventEmitter<MatDialogRef<ComponentType<any>>>();
  @Output() clickCell = new EventEmitter();
  @Output() clickRow = new EventEmitter();
  @Output() dblClickRow = new EventEmitter();
  @Output() createNew = new EventEmitter();
  @Output() deleteRecord = new EventEmitter();
  @Output() changeColumns = new EventEmitter();
  @Output() cancelClicked = new EventEmitter();

  @Input() selectedRows: any[] = [];
  @Output() selectedRowsChange = new EventEmitter<any[]>();


  public dataSource: MatTableDataSource<any> | JsonAPIDataSource;
  selectionModel = new SelectionModel<any>(true, this.selectedRows);
  selectedRow: any;

  private resultCountSubject = new BehaviorSubject<number>(0);
  public resultCount = this.resultCountSubject.asObservable();

  private filterValues = {};
  private dsFilterValues = {};
  private toggleSubscription: Subscription;
  protected subscriptions: Subscription = new Subscription();

  hasFilters = false;
  cumulativeSelections = false;

  isExporting = false;
  exportingSubscription: Subscription;

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;
  isMobile = false;

  // Hide columns from matTableExporter
  hiddenColumns: number[] = [];

  private isSingleClick = true;
  isResizing = false;
  deleteClicked: boolean;

  // For global filtering of a jsonApiDataSource
  public globalFilter: UntypedFormControl;
  private savedCustomUrl;

  private renderer: Renderer2;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatTable, { read: ElementRef, static: true }) matTableRef: ElementRef;
  @ViewChild('exporter') exporter: MatTableExporterDirective;
  @ViewChild('tableResizeComponent') tableResizeComponent: UsicTableResizeComponent;

  constructor(
    private snackBar: MatSnackBar,
    private resolve: ResolvePipe,
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private persistentSettings: PersistentSettingsService,
    private clipboard: ClipboardService,
    public dialog: MatDialog,
    private http: HttpClient,
    private rendererFactory: RendererFactory2,
    private jsonApiModelService: JsonApiModelService,
  ) {
    // Determine if columns should be hidden due to mobile viewer
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this.isMobile = this.mobileQuery.matches;
    this._mobileQueryListener = () => {
      changeDetectorRef.detectChanges();
      this.isMobile = this.mobileQuery.matches;
    };
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);

    // Get an instance of Angular's Renderer2 which is needed to open Excel downloads
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  ngOnInit() {

    // restore any saved settings for the table
    this.restoreColumnSettings();

    if (this.jsonApiDataSource) {
      this.dataSource = this.jsonApiDataSource;
      this.savedCustomUrl = this.jsonApiDataSource.customUrl;
      this.dsFilterValues = { ...this.jsonApiDataSource.filter };

      this.subscriptions.add(this.jsonApiDataSource.resultCount.subscribe(resultCount => {
        if (this.resultCountSubject.getValue() !== resultCount) {
          this.resultCountSubject.next(resultCount);
          // if the result count changes, then undo the current selection as current
          // selections may no longer be in the result set
          if (!this.cumulativeSelections) {
            this.masterToggle(true);
          }
        }
      }));

      this.pageSize = this.jsonApiDataSource.pageSize;

      // setup column filtering by subscribing to column filter value changes and sending
      // these values to the data source to filter with
      if (this.filtering === 'column') {
        for (const column of this.displayedColumns) {
          const columnName = column.name;
          const filterName = column.filterName || column.name;
          if (columnName !== undefined) {
            this.filterValues[filterName] = '';
            this[columnName + 'Filter'] = new UntypedFormControl('');
            this.subscriptions.add(this[columnName + 'Filter'].valueChanges
              .pipe(
                // debounce keystrokes so we don't make unnecessary API calls
                // for each keystroke as the user types in a filter value
                debounceTime(1000),
                distinctUntilChanged()
              )
              .subscribe((value: any) => {

                if (value !== undefined && value !== null) {

                  if (column.type && column.type === 'boolean') {
                    // BOOLEAN
                    // Table provides a "Yes/No" filter, but it need to be
                    // converted back to true/false value
                    if (value === 'true') {
                      this.filterValues[filterName] = true;
                    } else if (value === 'false') {
                      this.filterValues[filterName] = false;
                    } else {
                      this.filterValues[filterName] = '';
                    }
                  } else if (column.type && column.type === 'truthy') {
                    // TRUTHY
                    // Table provides a "Yes/No" filter, but it need to be
                    // converted back to possible DB values and filter for
                    // any of those values
                    let booleanValues: any[];
                    if (value === 'true') {
                      booleanValues = ['t', 'Pass', 1, 'true'];
                      this.filterValues[filterName] = booleanValues.join(',');
                    } else if (value === 'false') {
                      booleanValues = ['f', 'Fail', 'Not Eligible', 0, 'false'];
                      this.filterValues[filterName] = booleanValues.join(',');
                    } else {
                      this.filterValues[filterName] = '';
                    }
                  } else if (column.type && (column.type === 'date' || column.type === 'datetime') && value) {
                    // DATE
                    // To search for a date, you need to search for a range
                    // startofDate >= date >= endOfDate
                    //
                    // ATS-270 if the user enters just a year, do a YEAR search range
                    // otherwise do a 24 hour date range search.
                    // This is complicated by the fact that the values from the input are
                    // already converted to a Date field by the mat-datepicker before they
                    // are propagated to the column filter so we can't simply check for a
                    // year string (though we'll check for that too just in case it gets
                    // through).  Instead, a year string will come through as Jan 1 at 00:00
                    // but with no timezone, whereas a full date is offset by the local timezone.
                    // So search for "2022" results in a date of "2022-01-01T00:00:00.000Z"
                    // whereas a search for "2022-01-01" results in a date of "2022-01-01T05:00:00.000Z"
                    // We can check for a zero hour, except that the Date.getHours() takes the
                    // timezone into effect, meaning getHours for "2022-01-01T00:00:00.000Z"
                    // returns 19 not 0, so we check if get hours corresonds to an offset 0.
                    if ((typeof value === 'string' && value.match(/^[12][0-9]{3}$/)) ||
                      (value instanceof Date && value.getHours() === 24 - (value.getTimezoneOffset() / 60))) {
                      const convertedDateStart: Date = value instanceof Date ? value : new Date(Date.parse(value));
                      // correct the timezone offet
                      convertedDateStart.setMinutes(convertedDateStart.getMinutes() + convertedDateStart.getTimezoneOffset());
                      const convertedDateEnd: Date =
                        new Date((new Date(Date.parse(String(Number(convertedDateStart.getFullYear()) + 1)))).getTime() - 1000);
                      // correct the timezone offet
                      convertedDateEnd.setMinutes(convertedDateEnd.getMinutes() + convertedDateEnd.getTimezoneOffset());
                      this.filterValues[filterName] = { ge: convertedDateStart.toISOString(), le: convertedDateEnd.toISOString() };
                    } else {
                      const convertedDateStart: Date = value instanceof Date ? value : new Date(Date.parse(value));
                      convertedDateStart.setHours(0);
                      convertedDateStart.setMinutes(0);
                      const convertedDateEnd: Date = new Date(convertedDateStart.getTime());
                      convertedDateEnd.setHours(23);
                      convertedDateEnd.setMinutes(59);
                      this.filterValues[filterName] = { ge: convertedDateStart.toISOString(), le: convertedDateEnd.toISOString() };
                    }
                  } else if (value?.startsWith('!')) {
                    // NOT value
                    this.filterValues[filterName] = { NEQ: value.substr(1) };
                  } else {
                    // OTHER
                    if (typeof value === 'string' && value.trim().length > 0) {
                      if (column.type === 'filteredList') {
                        this.filterValues[filterName] = {
                          LIKE: value
                            .split(',')
                            .map(v => v.trim().length > 0 ? `%${v.trim()}%` : undefined)
                            .filter(v => v)
                            .join(',')
                        };
                      } else {
                        this.filterValues[filterName] = ((typeof value === 'string' && value.trim().length > 0) ?
                          { LIKE: `%${value.trim().replace(',', '%')}%` } : value);
                      }

                    } else {
                      this.filterValues[filterName] = value;
                    }
                  }

                  this.checkForFilters();
                  this.dsFilterValues = { ...this.jsonApiDataSource.filter };
                  const newFilter = deepAssign({}, this.dsFilterValues, this.filterValues);
                  this.dataSource.filter = newFilter;

                }

              }));
          }
        }
      }

    } else {
      this.dataSourceLoading = true;
      this.dataSource = new MatTableDataSource<any>();

      // see http://nataliesmith.ca/blog/angular-material-filter-table
      // for details on the per-column filtering
      // this is a genericized implementation to handle dynamic column names
      if (this.filtering === 'column') {
        (this.dataSource as MatTableDataSource<any>).filterPredicate = this.columnFilter();
        this.filterValues = {};

        for (const column of this.displayedColumns) {
          const columnName = column.name;
          if (columnName !== undefined) {
            this.filterValues[columnName] = '';
            this[columnName + 'Filter'] = new UntypedFormControl('');
            this.subscriptions.add(this[columnName + 'Filter'].valueChanges
              .pipe(
                // debounce keystrokes so we don't do unnecessary work
                // for each keystroke as the user types in a filter value
                debounceTime(1000),
                distinctUntilChanged()
              )
              .subscribe(value => {
                this.filterValues[columnName] = (typeof value === 'string' ? value.trim() : value);
                this.checkForFilters();
                this.dataSource.filter = JSON.stringify(this.filterValues);
              }));
          }
        }
      }

      if (this.data) {
        // Assign the data to the data source for the table to render
        this.subscriptions.add(this.data.subscribe(data => {
          // In case this is a completely new dataset (report),
          // restore saved column preferences to preserve ordering and visibilty
          this.restoreColumnSettings();

          (this.dataSource as MatTableDataSource<any>).data = data;
          this.resultCountSubject.next(data ? data.length : 0);

          this.dataSourceLoading = false;
          this.ngAfterViewInit();
        }));

      }

    }

    if (this.filtering === 'global') {
      this.globalFilter = new UntypedFormControl('');
      this.subscriptions.add(this.globalFilter.valueChanges
        .pipe(
          // debounce keystrokes so we don't make unnecessary API calls
          // for each keystroke as the user types in a filter value
          debounceTime(1000),
          distinctUntilChanged()
        )
        .subscribe((value: any) => {
          this.doGlobalFilter(value);
        })
      );
    }

    if (this.selectByKey !== undefined && this.selectByValue !== undefined) {
      this.subscriptions.add(this.selectByValue.subscribe(value => this.selectRowByKeyValue(this.selectByKey, value)));
    }

  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

    // CP-193 if an initial sort was set when initializing the datasource
    // then it can get lost here, so we preserve it
    const saveActive = this.dataSource.sort?.active;

    this.dataSource.sort = this.sort;

    // CP-193
    if (saveActive) {
      this.dataSource.sort.active = saveActive;
    }

    this.dataSource.paginator.page.subscribe((page: PageEvent) => {
      // Detect changes in page size and adjust the table wrapper height accordingly
      if (page.pageSize !== this.pageSize) {
        this.pageSize = page.pageSize;
      }
      this.changePage.emit(page);
    });

  }

  ngOnChanges(changes: SimpleChanges) {
    // If the parent component clears out the selected rows, then ensure that is correctly
    // reflected in the selectionModel
    if (changes.selectedRows?.previousValue?.length && changes.selectedRows?.currentValue?.length === 0) {
      this.masterToggle(true);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.toggleSubscription) {
      this.toggleSubscription.unsubscribe();
    }
  }

  /**
   * restore any saved settings for the table
   */
  restoreColumnSettings() {

    let columnsChanged = false;

    // first restore user column hiding preferences
    for (const [index, column] of this.displayedColumns.entries()) {
      if (this.persistColumns === true) {
        const hidden = this.persistentSettings.getSetting(`${this.prefix}${this.prefix ? '-' : ''}${column.name}-hidden`);
        if (hidden) {
          column.hidden = (hidden === 'true');
          columnsChanged = true;
        }
      }
      // Don't export special 'action' columns
      if (column.name === 'select' ||
        column.name === 'delete' ||
        column.type === 'icon' ||
        column.hidden) {
        this.hiddenColumns.push(index);
      }
    }

    // next restore and changed column order
    if (this.persistColumns === true) {
      let savedOrder: string | string[] = this.persistentSettings.getSetting(`${this.prefix}${this.prefix ? '-' : ''}column-order`);
      if (savedOrder) {
        savedOrder = savedOrder.split(',');
        this.displayedColumns.sort((a, b) => savedOrder.indexOf(a.name) - savedOrder.indexOf(b.name));
        columnsChanged = true;
      }
    }
    if (columnsChanged) {
      this.changeColumns.emit({ displayedColumns: this.displayedColumns });
    }

  }

  getFormControl(columnName: string): UntypedFormControl {
    return this[columnName + 'Filter'];
  }

  get columnNames(): string[] {
    return this.displayedColumns.map(c => c.icon || c.name);
  }

  get printableColumns(): UsicTableColumn[] {
    return this.displayedColumns
      .filter(c => c.name !== 'select' &&
        c.name !== 'delete' &&
        !c.hidden &&
        c.type !== 'icon');
  }

  // get current list of displayed table columns for json:api 'fields' column
  get fields() {
    // ATS-340
    const validFields = this.jsonApiModelService.inspect(this.jsonApiDataSource.model).map(f => f.dbName);
    const fields = this.printableColumns
      .map(c => c.altName ?
        c.altName :
        (c.filterName === 'none' ?
          (c.sortName === 'none' ?
            (c.name.match(/\.length$/) ? c.name.replace(/\.length$/, '') : 'none') :
            // CP-231
            c.sortName) :
          c.filterName || c.sortName || c.name.replace(/\.length$/, '')))
      .filter(c => c !== 'none')
      .filter(c => c.indexOf('.') ? validFields.includes(c.split('.')[0]) : validFields.includes(c));
    return fields.join(',');
  }


  // Determine the minimum set of includes necessary to support the selected table columns
  get includesForFields() {
    // ATS-340
    const validIncludes = this.jsonApiModelService.inspect(this.jsonApiDataSource.model)
      .filter(i => ['BelongsTo', 'HasMany'].includes(i.relation))
      .map(f => f.dbName);

    // First we get down to the actual minimal includes set
    let minimumIncludes = [...new Set(this.fields.split(',')
      .map(f => f.split('.'))
      .map(f => {
        if (f.length > 1) {
          f.pop();
          return f.join('.');
        }
      })
      .filter(f => f)
    )].join(',');

    // Next, add in any 1-to-many models that we want a count of
    minimumIncludes = [...new Set(this.displayedColumns
      .filter(c => !c.hidden &&
        c.name.endsWith('.length')).map(f => f.name.replace(/\.length$/, ''))
    ), minimumIncludes].join(',');

    // Next remove any invalid includes ATS-340
    minimumIncludes = [...new Set(minimumIncludes.split(',')
      .filter(i => i.indexOf('.') ? validIncludes.includes(i.split('.')[0]) : validIncludes.includes(i)))]
      .join(',');

    // Finally, the export filter on the server has a problem if you include a nested model
    // without including it's parent(s), so put back any parent models that were removed
    // since no fields were directly related to it.
    minimumIncludes = [...new Set(minimumIncludes.split(',')
      .map(i => i.split('.'))
      .flatMap(a => {
        const parents = [];
        while (a.length > 1) {
          a.pop();
          parents.push(a.join('.'));
        }
        return parents;
      })
      .filter(i => i)
    ), minimumIncludes].join(',');

    return minimumIncludes ? minimumIncludes : undefined;
  }

  get hasFooter() {
    if (this.totaledColumns.length) {
      return true;
    } else {
      return false;
    }
  }

  hasTotalForColumn(name: string) {
    return this.totaledColumns.map(c => c.name).includes(name);
  }

  getTotalForColumn(name: string) {
    return this.totaledColumns.find(c => c.name === name)?.total;
  }

  onChangeColumns(displayedColumns) {
    this.changeColumns.emit(displayedColumns);
    this.updateDisplayedColumns();
  }

  /**
   * Inform relevant parties that the columns have changed
   */
  updateDisplayedColumns() {
    this.tableResizeComponent?.setTableResize();

    // update the hiddenColumns array used by the exporter (ATS-172)
    this.hiddenColumns.length = 0;
    for (const [index, column] of this.displayedColumns.entries()) {
      if (column.name === 'select' ||
        column.name === 'delete' ||
        column.type === 'icon' ||
        column.hidden) {
        this.hiddenColumns.push(index);
      }
    }

  }

  /**
   * Check if the user has entered any filter values in order to show the "Clear Filters" button
   */
  checkForFilters() {
    let filterFound = false;
    if (this.filtering === 'column') {
      for (const column of this.displayedColumns) {
        const columnName = column.name;
        if (columnName === 'select') {
          continue;
        }
        const filterName = column.filterName || column.name;
        if (columnName !== undefined) {
          const filter = this.filterValues[filterName];
          if (filter !== undefined && filter !== null &&
            (filter.length > 0 || typeof filter === 'boolean' || typeof filter === 'object')) {
            filterFound = true;
            break;
          }
        }
      }
    }
    this.hasFilters = filterFound;
  }

  /**
   * Clear any previously entered column filters
   *
   * @param dsFilterValues optional set of base (immutable) filters
   *
   * Returns true if the data source filter was changed
   */
  clearFilters(dsFilterValues?) {
    if (dsFilterValues) {
      this.dsFilterValues = { ...dsFilterValues };
    }

    if (this.hasFilters) {
      if (this.filtering === 'column') {
        for (const column of this.displayedColumns) {
          const columnName = column.name;
          if (columnName === 'select') {
            continue;
          }
          const filterName = column.filterName || column.name;
          if (columnName !== undefined) {
            const filter = this.filterValues[filterName];
            if (filter !== undefined &&
              (filter.length > 0 || typeof filter === 'boolean' || typeof filter === 'object')) {
              this.filterValues[filterName] = '';
              (this[columnName + 'Filter'] as UntypedFormControl).setValue(undefined);
            }
          }
        }

        this.hasFilters = false;

        if (this.jsonApiDataSource) {
          this.dataSource.filter = deepAssign({}, this.dsFilterValues, this.filterValues);
        } else {
          this.dataSource.filter = JSON.stringify(this.filterValues);
        }

      } else if (this.filtering === 'global') {
        if (!this.jsonApiDataSource) {
          this.dataSource.filter = '';
        }
      }
      return true;
    }
  }

  /**
   * Set the column filter value to a new value.  This doesn't actually trigger a change
   * to the data source filtering.  This is intended to set the field to match a filter
   * that's been applied externally.
   *
   * @param columnName
   * @param filterValue
   */
  setColumnFilter(columnName, filterValue) {

    const column = this.displayedColumns.find(c => c.name === columnName || c.filterName === columnName);

    if (column?.name) {
      filterValue = filterValue.replace(/^%|%$/g, '');
      (this[column?.name + 'Filter'] as UntypedFormControl)?.setValue(filterValue, { emitEvent: false });
    }
  }

  doGlobalFilter(filterValue: string) {
    if (this.jsonApiDataSource) {
      // In order construct an "OR" filter across all the column filters
      // we need a nested filter which is in a format that the angular2-jsonapi library doesn't support
      // So, we'll build our own custom URL to specify the filters as needed.

      if (filterValue.trim().length > 0) {

        let requestParams = decodeURI(this.jsonApiDataSource.getRequestParams());

        const filters = [];
        for (const column of this.displayedColumns) {
          const columnName = column.name;
          if (columnName === 'select' || column.hidden || column.type !== 'string') {
            continue;
          }
          const filterName = column.filterName || column.name;
          if (filterName !== undefined) {
            const filterNames = filterName.split('.');
            const columnFilter = {};

            this.filterValues[filterName] =
              filterValue
                .split(',')
                .map(v => v.trim().length > 0 ? `%25${v.trim()}%25` : undefined)
                .filter(v => v)
                .join(',');
            let filter: any = { LIKE: columnFilter };

            // Create nesting for compound attribute names
            while (filterNames.length >= 1) {
              const superFilter = {};
              const superFilterName = filterNames.pop();
              superFilter[superFilterName] = filter;
              filter = superFilter;
            }
            filters.push(filter);
          }
        }

        requestParams = `filter={"OR":${JSON.stringify(filters)}}&${requestParams}`;
        console.log(requestParams);

        this.jsonApiDataSource.customUrl = `${this.jsonApiDataSource.baseUrl}?${requestParams}`;
        this.jsonApiDataSource.loadData();
      } else {
        // restore original results
        this.jsonApiDataSource.customUrl = this.savedCustomUrl;
        this.jsonApiDataSource.loadData();
      }

    } else {
      this.dataSource.filter = filterValue.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  /**
   * columnFilter
   *
   * For static data sets (@Input data) only, this method builds a filterFunction that
   * is assigned to the MatTableDataSource's filterPredicate to filter the data
   */
  columnFilter(): (data: any, filter: string) => boolean {
    // note: this function will search through each row of the table so adding
    // logging really slows down the filtering
    const truthy = /^\s*(t|y|true|1|on|yes)\s*$/i;
    const filterFunction = (data, filter): boolean => {
      const searchTerms = JSON.parse(filter);

      // if all the search terms are empty, then we keep every row
      let keepRow = Object.values(searchTerms).every(
        v => (v === undefined || v === null || (v as string).length === 0));

      if (!keepRow) {
        keepRow = true;
        for (const searchTerm in searchTerms) {
          // eslint-disable-next-line no-prototype-builtins
          if (searchTerms.hasOwnProperty(searchTerm)) {

            // handle nested searchTerms containing dot notation
            // nosemgrep: ajinabraham.njsscan.regex_dos.regex_dos
            let searchValue = data;
            searchTerm.split('.').forEach(attr => { searchValue = searchValue ? searchValue[attr] : undefined; });

            if (searchTerms[searchTerm] !== null && searchTerms[searchTerm].length > 0) {
              const columnType = this.displayedColumns[this.displayedColumns.map(c => c.name)
                .indexOf(searchTerm)].type;
              switch (columnType) {
                case 'date':
                  keepRow = (new Date(Date.parse(searchValue)).setHours(0, 0, 0, 0) ===
                    new Date(Date.parse(searchTerms[searchTerm])).setHours(0, 0, 0, 0));
                  break;
                case 'boolean':
                  keepRow = truthy.test(searchValue) === truthy.test(searchTerms[searchTerm]);
                  break;
                default:
                  keepRow = String(searchValue).toLowerCase()
                    .indexOf(searchTerms[searchTerm].toLowerCase()) !== -1;
              }
            }
            if (!keepRow) { break; }
          }
        }
      }

      return keepRow;
    };
    return filterFunction;
  }

  /**
   * onCellClick - any cell that doesn't already include a link will allow the value to be
   * clicked on.  If the column has a click function defined for that value, the click
   * function will be invoked, otherwise, the data will be emitted to the clickCell event
   *
   * @param event : MouseEvent
   * @param column : UsicTableColumn
   * @param row the row of data
   */
  onCellClick(event: MouseEvent, column: UsicTableColumn, row: any) {
    this.deleteClicked = column.name === 'delete';
    let value: any;
    if (column.clickName) {
      value = this.resolve.transform(row, column.clickName);
    } else {
      value = this.resolve.transform(row, column.name);
    }

    if (typeof column.clickFn === 'function') {
      column.clickFn(event, value, row);
    } else {
      if (column.editable) {
        this.openCellEditor(column, value, row);
        event.stopPropagation();
      } else {
        this.clickCell.emit({ event, key: column.name, value, row });
      }
    }
  }

  /**
   * onRowClick - whenever a row is clicked, emit the row as en event
   *
   * @param event : MouseEvent,PointerEvent
   * @param row the row of data
   */
  onRowClick(event: any, row: any) {

    // If this is a link, follow the link and don't do the rowClick
    if (event.target?.href) {
      return;
    }

    if (row && this.deleteClicked) {
      this.onDelete(row);
      this.deleteClicked = false;
      return;
    }

    this.isSingleClick = true;
    setTimeout(() => {
      if (this.isSingleClick) {
        this.selectedRow = row;

        if (this.editComponent) {

          this.onEdit(this.editComponent, row);

        } else {

          this.clickRow.emit({ event, row });

        }

      }
    }, 250);
  }

  onEdit(editComponent: ComponentType<any>, row: any) {

    // editComponent is sent via data so usic-dialog can use it to access the current dialogRef
    const dialogRef = this.dialog.open(editComponent, {
      data: {
        model: row,
        dialogComponent: editComponent.name,
        savedStatus: undefined
      }
    });
    this.openDialog.emit(dialogRef);

    dialogRef.afterClosed().subscribe(closedVia => {

      const savedStatus = dialogRef.componentInstance.data.savedStatus ? ' Saved!' : ' Not Saved.';

      if (this.cancelRefresh) {
        console.log('table refresh canceled');
      } else {
        console.log(savedStatus);
        if (dialogRef.componentInstance.data.savedStatus) {
          this.snackBar.open((closedVia || 'ESC Pressed.') + savedStatus, 'OK',
            { duration: 2000, panelClass: 'multi-line-snackbar' });
        }
        this.refresh();
      }

      this.openDialog.emit(undefined);
    });

  }

  @Input() cancelRefresh: boolean;
  @Output() refreshData = new EventEmitter<any>();
  refresh() {
    this.refreshData.emit();

    if (this.jsonApiDataSource) {
      this.jsonApiDataSource.loadData();
    }

  }

  /**
   * onDelete - whenever the delete icon is clicked, emit the row as the record to be deleted
   *
   * @param row the row of data
   */
  onDelete(row) {
    this.deleteRecord.emit(row);
  }

  /**
   * onRowDblClick - whenever a row is double clicked, emit the row as en event
   *
   * @param event : MouseEvent
   * @param row the row of data
   */
  onRowDblClick(event: MouseEvent, row: any) {
    this.isSingleClick = false;
    this.selectedRow = row;
    this.dblClickRow.emit({ event, row });
  }

  /**
   * onCreateNew - whenever the Add New button is clicked, emit the event and a new record
   *
   * @param event : MouseEvent
   * @param row a new record
   */
  onCreateNew(event: MouseEvent) {
    if (this.allowNew) { this.onRowClick(event, undefined); }
    this.createNew.emit();
  }

  /**
   * onContextMenu - whenever a cell is right clicked, invoke the contextFn
   *
   * @param event : MouseEvent
   * @param column : UsicTableColumn
   * @param row the row of data
   */
  onContextMenu(event: MouseEvent, column: UsicTableColumn, row: any) {
    let value: any;
    if (column.clickName) {
      value = this.resolve.transform(row, column.clickName);
    } else {
      value = this.resolve.transform(row, column.name);
    }

    if (typeof column.contextFn === 'function') {
      column.contextFn(event, value);
    } else {
      this.clipboard.copy(value);
    }
    return false;
  }

  /**
   * selectRowByKeyValue - triggered when new selectByValue values are observed
   * This will find the table row with the specified value for the column name
   * set as the key and set that row as selected
   *
   * @param key  column name to search values of
   * @param value  value to search for
   */
  selectRowByKeyValue(key, value) {
    if (value) {
      // If nothing was selected or this is a new selection
      if (!this.selectedRow || this.selectedRow[key] !== value) {
        if (this.jsonApiDataSource) {
          this.selectedRow = this.jsonApiDataSource.filteredData.find(row => String(row[key]) === String(value));
        } else {
          this.selectedRow = (this.dataSource as MatTableDataSource<any>).data.find(row => row[key] === value);
        }
      }
    } else {
      // A missing value is usually from closing a linked map info bubble so this
      // will deselect the row when the map bubble is closed.
      this.selectedRow = undefined;
    }
  }

  toggleRow(row: any) {
    this.selectionModel.toggle(row);
    try {
      this.exporter?.toggleRow(this.dataSource.filteredData.indexOf(row));
    } catch (error) {
      console.error('Problem toggling row in exporter:', error.message);
    }

    if (this.jsonApiDataSource) {
      // reselect for jsonApiData source paging
      if (this.toggleSubscription) {
        this.toggleSubscription.unsubscribe();
      }
      this.toggleSubscription = this.jsonApiDataSource.reconnect().subscribe(data => {
        this.exporter?.resetToggleRows();

        // the Angular SelectionModel isn't smart enough to identify a new copy of the
        // same object as being the same object, so, if the data source returns a new
        // copy of a model, remove the old copy before we select the new copy
        data.forEach(r => {
          const currentIndex = this.selectionModel.selected.findIndex(s => s.id === r.id);
          if (currentIndex !== -1) {
            this.selectionModel.deselect(this.selectionModel.selected[currentIndex]);
            this.selectionModel.select(r);

            try {
              this.exporter?.toggleRow(this.dataSource.filteredData.indexOf(r));
            } catch (error) {
              console.error('Problem toggling row in exporter:', error.message);
            }

          }
        });
        this.selectedRowsChange.emit(this.selectionModel.selected);
      });
    }
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(wasChecked: boolean) {
    if (wasChecked) {
      if (this.selectionModel.selected.length) {
        this.selectionModel.clear();
        this.exporter?.resetToggleRows();
        this.selectedRowsChange.emit(this.selectionModel.selected);

        // if we have an active jsonApiDataSource subscription to select data as it comes in
        // stop the subscription
        if (this.toggleSubscription) {
          this.toggleSubscription.unsubscribe();
        }
      }
    } else {
      if (this.jsonApiDataSource) {
        const numRows = this.resultCountSubject.getValue();
        if (numRows > 1000 ? confirm(`This will load ${numRows.toLocaleString()} rows into the table which may take a while.
Do you want to continue?`) : true) {
          this.paginator._changePageSize(numRows);

          // We don't actually have all the data for a jsonApiDataSource, so we setup a subscription
          // that will select new data as it is loaded
          this.toggleSubscription = this.jsonApiDataSource.reconnect().subscribe(data => {
            this.exporter?.resetToggleRows();

            // the Angular SelectionModel isn't smart enough to identify a new copy of the
            // same object as being the same object, so, if the data source returns a new
            // copy of a model, remove the old copy before we select the new copy
            data.forEach(row => {
              const currentIndex = this.selectionModel.selected.findIndex(s => s.id === row.id);
              if (currentIndex !== -1) {
                this.selectionModel.deselect(this.selectionModel.selected[currentIndex]);
              }
              this.selectionModel.select(row);

              try {
                this.exporter?.toggleRow(this.dataSource.filteredData.indexOf(row));
              } catch (error) {
                console.error('Problem toggling row in exporter:', error.message);
              }

            });
            this.selectedRowsChange.emit(this.selectionModel.selected);
          });
        }
      } else {
        (this.dataSource as MatTableDataSource<any>).data.forEach(row => {
          this.selectionModel.select(row);

          try {
            this.exporter?.toggleRow(this.dataSource.filteredData.indexOf(row));
          } catch (error) {
            console.error('Problem toggling row in exporter:', error.message);
          }

        });
        this.selectedRowsChange.emit(this.selectionModel.selected);
      }
    }
  }

  get page(): number | null { return this.dataSource.paginator?.pageIndex; }
  set page(index: number) {
    if (this.dataSource.paginator) {
      // enforce valid page range
      if (index < 0) {
        index = 0;
      } else if (index >= this.pageCount) {
        index = this.pageCount - 1;
      }

      // this.dataSource.paginator.pageIndex = index;
      this.dataSource.paginator.page.next({
        pageIndex: index,
        pageSize: this.dataSource.paginator.pageSize,
        length: this.dataSource.paginator.length
      });
    }
  }

  get pageCount(): number | null {

    if (this.dataSource.paginator && this.dataSource.paginator.length > 0) {
      const size = this.dataSource.paginator.pageSize;
      const len = this.dataSource.paginator.length;
      return Math.ceil(len / size);
    }

  }

  /**
   * exportTable
   *
   * Utilize the MatTableExporter to export the table data to an Excel file
   *
   * @param exportType 'xls' | 'xlsx' | 'csv' | 'txt' | 'json' | 'other'
   * @param options
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exportTable(exportType?: 'xls' | 'xlsx' | 'csv' | 'txt' | 'json' | 'other', options?: Options | ExcelOptions) {
    this.isExporting = true;

    if (this.jsonApiDataSource) {
      // && this.selectionModel.isEmpty()) {
      // Adding the clause to skip this part if the selectionModel is empty
      // allows rapid exporting for selected rows if they're all in the current
      // displayed page, but will not export rows from unloaded pages.
      const prePageSize = this.paginator.pageSize;
      const numRows = this.resultCountSubject.getValue();
      if (numRows > 1000 ? confirm(`This will load ${numRows.toLocaleString()} rows into the table which may take a while.
Do you want to continue?`) : true) {

        this.paginator._changePageSize(numRows);
        const sub = this.jsonApiDataSource.loading.subscribe((status) => {
          // When done loading all the table rows, export the table,
          // then return it back to it's original page size
          if (status === false) {
            this.exporter.exportTable(exportType, options);
            try {
              sub.unsubscribe();
            } catch { }
            this.exporter.exportCompleted.subscribe(() => {
              this.paginator._changePageSize(prePageSize);
              this.isExporting = false;
            });
          }
        });
      } else {
        this.isExporting = false;
      }
    } else {
      this.exporter.exportTable(exportType, options);
      this.exporter.exportCompleted.subscribe(() => {
        this.isExporting = false;
      });
    }
    return this.isExporting;
  }

  /**
   * exportToExcel
   *
   * The mat-table-exporter used in the USICTable can build an Excel file from the
   * table in the browser, but for large data sets it is VERY slow.  We can have the
   * API build and return an Excel file on the server for us.
   * In order to cause the API to return an Excel (XLSX) file instead of JSON:API data
   * we set the HTTP Request 'accept' header to include the XLSX mime data type and
   * include the list of fields (columns) the user has selected in the table in order
   * to generate a matching spreadsheet
   */
  exportToExcel() {
    if (this.jsonApiDataSource) {

      // get the model name for the filename
      // We can't simply use 'this.jsonApiDataSource.model.name' because in
      // the production build, the JS is minimized and the name becomes some
      // random letters.  Instead, we'll utilize the JsonApiModelConfig annotation
      // to get the data type for the filename
      const fileName = Reflect.getMetadata('JsonApiModelConfig', this.jsonApiDataSource.model)?.type || 'export';

      if (this.resultCountSubject.getValue() <= this.pageSize) {

        // If the full dataset is already loaded, then just render the Excel in the browser immediately
        this.exportTable('xlsx', { fileName });

      } else {
        this.snackBar.open(`Exporting of large data sets can take several minutes.\n
        You may continue working and the Excel file will be downloaded when complete.`, 'OK',
        { duration: 5000, panelClass: 'multi-line-snackbar' });

        // There's more than one page of data, so let the server build the Excel file
        this.isExporting = true;

        // Get the current URL being used to build the table,
        // optimizing the include list and add the 'fields' parameter
        // to list the table columns the user wants
        const endpoint = this.jsonApiDataSource.customUrl ?
          // eslint-disable-next-line max-len
          `${this.jsonApiDataSource.baseUrlForExport}?${this.jsonApiDataSource.customUrl.split('?').pop().split('&').map(line => line.startsWith('include') ? `include=${this.includesForFields}` : line).join('&')}&fields=${this.fields}` :
          // eslint-disable-next-line max-len
          `${this.jsonApiDataSource.baseUrlForExport}?${this.jsonApiDataSource.getRequestParams({ include: this.includesForFields })}&fields=${this.fields}`;

        // Invoke the URL directly so we can receive and process the resulting Excel file
        this.exportingSubscription = this.http.get(endpoint, {
          responseType: 'blob' as 'json',
          headers: { accept: 'application/vnd.api+json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        })
          .subscribe({

            next: (data: any) => {
              const dataType = data.type;
              if (dataType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                const binaryData = [];
                binaryData.push(data);

                // create an temporary link to open the file
                const anchor = this.renderer.createElement('a');
                const binaryURL = window.URL.createObjectURL(new Blob(binaryData, { type: dataType }));
                this.renderer.setProperty(anchor, 'href', binaryURL);
                this.renderer.setAttribute(anchor, 'download', `${fileName}.xlsx`);
                this.renderer.appendChild(document.body, anchor);
                anchor.click();

                // remove the temporary link
                this.renderer.removeChild(document.body, anchor);
              } else {
                // Non Excel file
                alert(`The server did not return an Excel file.
An Excel file will be constructed using the table instead.`);
                console.error('Did not receive XLSX file from server.  Instead received', dataType);

                // The API export didn't work, so try the MatTableExporter instead
                this.exportTable('xlsx', { fileName });
              }
              this.isExporting = false;
            },

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            error: (error) => {
              // Could not download Excel file
              alert(`The server reported a problem generating the Excel file.
An Excel file will be constructed using the table instead.`);
              console.error(error);

              // The API export didn't work, so try the MatTableExporter instead
              this.exportTable('xlsx', { fileName });
              this.isExporting = false;
            }
          });

      }


    } else {
      this.getExportFormat().subscribe(format => {
        this.exportTable(format);
        this.isExporting = false;
      });
    }
    return this.isExporting;
  }

  /**
   * getExportFormat
   * Open a simple dialog to allow choice of Excel or CSV format for exporting static tables
   *
   * @returns 'xlsx' | 'csv'
   */
  getExportFormat(): Observable<'xlsx' | 'csv'> {
    return new Observable<'xlsx' | 'csv'>(observer => {
      const dialogRef = this.dialog.open(ExportFormatDialogComponent, {
        height: '150px',
        width: '260px',
        disableClose: false,
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          observer.next(result);
        }
        observer.complete();
      });
    });
  }

  cancelExport() {
    if (this.isExporting) {
      this.exportingSubscription.unsubscribe();
      this.jsonApiDataSource.cancel();
      this.isExporting = false;
    }
  }

  // replaces usic-table.html need to remove hard-coding of styling -->
  @Output() rowClasses = new EventEmitter<any>();
  setClasses(row: any) {

    const rowClasses = [];

    // 'selected' : row === selectedRow, 'bg-usic-warn-light' : row.inTransfer
    // Either row is selected from the 'select' checkbox, or was selected
    // through another component like the usic-map-table
    if (this.selectionModel.isSelected(row) || row === this.selectedRow) {
      rowClasses.push('selected');
    }

    if (rowClasses) {

      this.rowClasses.emit({ data: row, classes: rowClasses });
      return rowClasses;

    }

  }

  // Allow table sizes less than 5 for small results
  get tableSize() {
    const size = (this.pageSize === 5 &&
      this.resultCountSubject.getValue() &&
      this.resultCountSubject.getValue() < this.pageSize) ?
      this.resultCountSubject.getValue() :
      this.pageSize;
    return size;
  }

  /**
   * Open a simple dialog to edit the cell value.
   *
   * @param name
   * @param title
   * @param type
   * @param value
   * @param row
   */
  openCellEditor(column: UsicTableColumn, value: string, row: JsonApiModel) {

    const cellEditorDialogRef = this.dialog.open(CellEditorComponent, {
      data: { column, value },
      width: 'auto', minWidth: '30%', maxWidth: '90%',
      height: 'auto',
      disableClose: false,
      panelClass: 'cell-editor'
    });

    cellEditorDialogRef.afterClosed().subscribe(result => {

      if (result && (result.cell !== value)) {

        row[column.name] = result.cell;
        row.save().subscribe({
          complete: () => {
            this.jsonApiDataSource.loadData();
          },
          error: error => { console.error(error); }
        });

      }

    });
  }


}

@Component({
  selector: 'export-format-dialog',
  template: `
  <h1 style="justify=content: center;" mat-dialog-title >Export Format</h1>
  <div mat-dialog-actions>
    <button mat-flat-button [mat-dialog-close]="'xslx'" color="accent">Excel</button>
    <button mat-button [mat-dialog-close]="'csv'" >CSV</button>
    <button mat-button mat-dialog-close>Cancel</button>
  </div>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class ExportFormatDialogComponent { }
