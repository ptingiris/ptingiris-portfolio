/********************************************************************************
 * UsicMapTableComponent (lib-usic-map-table)
 *
 * Angular component that is a composite of the here-map and usic-table components
 * and adds the wiring to connect row selections to map parkers
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
 *   jsonApiDataSource  : DataSource connected to a JSON:API to dynamically
 *                        retrieve data for the table
 *
 *   dataSourceLoading  : boolean to indicate if the loading indicator should be
 *                        turned on.  Normally this is handled automatically by the
 *                        USIC table component, but this allows some external control
 *
 *   filterType         : string indicating type of filtering to provide.
 *                        none     : no filtering added
 *                        'global' : a single filter field is provided to filter
 *                                   across all data in the table
 *                        'column' : filter fields are added to each column header
 *
 *   expandFilters      : boolean to indicate if filters section should be shown
 *
 *   provideExcelExport : boolean to indicate if the button to provide download
 *                        of table data as an Excel file should be shown
 *   selectByKey        : string - a column name to be used for external row
 *                        selection notifications
 *   selectedTicketId   : Observable<any> - a column value to indicate which
 *                        row value to match for an external selection
 *   cancelRefresh      : boolean used to cancel refreshing of jsonApiDataSource when closing an edit dialog

 *   editComponent      : component to use to open the edit dialog
 *
 *   displayedTickets   : Observable for array of locatable objects for map. { lat, lon, ... }
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
 *
 * author: Pam Tingiris
 ********************************************************************************/

import { Component, OnInit, Input, ViewChild, EventEmitter, Output } from '@angular/core';
import { JsonAPIDataSource } from '../../datasources/jsonapi.datasource';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ComponentType } from '@angular/cdk/portal';
import { UsicSidebarComponent } from '../usic-sidebar/usic-sidebar.component';
import { UsicTableComponent } from '../usic-table/usic-table.component';
import { MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'lib-usic-map-table',
  templateUrl: './usic-map-table.component.html',
  styleUrls: ['./usic-map-table.component.scss']
})
export class UsicMapTableComponent implements OnInit {
  @ViewChild('mapSidebar') mapSidebar: UsicSidebarComponent;
  @ViewChild('usicTable') usicTable: UsicTableComponent;

  @Input() expandFilters = true;
  @Input() showMoreIcon = true;
  @Input() ticketType;
  @Input() filterType;
  @Input() isLoaded: BehaviorSubject<boolean>;
  @Input() displayedTickets;
  // When a dynamic DataSource is provided
  @Input() jsonApiDataSource: JsonAPIDataSource;
  @Input() editComponent: ComponentType<any>;

  @Input() displayedColumns;
  @Input() provideExcelExport;
  @Input() selectByKey = 'ticketId';
  @Input() cancelRefresh: boolean;
  @Input() dataSourceLoading = false;
  @Input() disableShowAll = false;

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


  selectedTicketSubject = new BehaviorSubject<number>(undefined);
  selectedTicketId = this.selectedTicketSubject.asObservable();

  constructor(
    protected router: Router
  ) { }

  ngOnInit() {
  }

  /**
   * This is a notification event from the here-map when a ticket marker is clicked
   */
  selectTicketById({ markerId }) {
    if (this.selectedTicketSubject.value !== markerId) {
      this.selectedTicketSubject.next(markerId);
    }
  }


  /**
   * Force the map sidebar to be displayed if the user has closed it.
   * Generally this is needed when the user picks to show something on the map, but
   * the map is closed.
   */
  showMap() {
    this.mapSidebar.showSidebar();
  }

  /**
   * Clear any previously entered column filters
   *
   * @param dsFilterValues optional set of base (immutable) filters
   *
   * Returns true if the data source filter was changed
   */
  clearFilters(dsFilterValues?) {
    return this.usicTable.clearFilters(dsFilterValues);
  }
}
