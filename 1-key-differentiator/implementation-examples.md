# Implementation Examples

This document showcases real-world implementation examples of the component library across different applications, demonstrating its flexibility and extensibility.

## Table of Contents

1. [Asset Management Application](#asset-management-application)
2. [Customer Portal Application](#customer-portal-application)
3. [Field Tracking Application](#field-tracking-application)
4. [Reporting Application](#reporting-application)
5. [Common Implementation Patterns](#common-implementation-patterns)

---

## Asset Management Application

### Asset Inventory Table with Map Integration

This example demonstrates the integration of the table component with spatial data visualization for tracking physical assets.

#### Component Template

```html
<div class="asset-inventory-container">
  <app-page-header title="Asset Inventory" [subtitle]="totalAssets | async"></app-page-header>
  
  <lib-usic-map-table
    [displayedColumns]="assetColumns"
    [jsonApiDataSource]="assetDataSource"
    [displayedTickets]="assetLocations$ | async"
    [filterType]="'column'"
    [expandFilters]="true"
    [provideExcelExport]="true"
    [editComponent]="assetEditComponent"
    [selectByKey]="'assetId'"
    (clickCell)="onAssetCellClick($event)"
    (changeColumns)="onAssetColumnsChange($event)">
    
    <div class="toolbar-actions">
      <button mat-button color="primary" (click)="refreshAssets()">
        <mat-icon>refresh</mat-icon> Refresh
      </button>
      
      <button mat-button color="primary" (click)="importAssets()">
        <mat-icon>upload</mat-icon> Import
      </button>
      
      <button mat-flat-button color="accent" (click)="addNewAsset()">
        <mat-icon>add</mat-icon> New Asset
      </button>
    </div>
  </lib-usic-map-table>
</div>
```

#### Component Class

```typescript
@Component({
  selector: 'app-asset-inventory',
  templateUrl: './asset-inventory.component.html',
  styleUrls: ['./asset-inventory.component.scss']
})
export class AssetInventoryComponent implements OnInit, OnDestroy {
  assetColumns: UsicTableColumn[] = [
    { name: 'select', type: 'boolean' },
    { name: 'assetTag', title: 'Asset Tag', type: 'string', 
      filterName: 'assetTag', sortName: 'assetTag' },
    { name: 'serialNumber', title: 'Serial Number', type: 'string', 
      filterName: 'serialNumber', sortName: 'serialNumber' },
    { name: 'assetType.name', title: 'Asset Type', type: 'string', 
      filterName: 'assetType.name', sortName: 'assetType.name' },
    { name: 'status.name', title: 'Status', type: 'string', 
      filterName: 'status.name', sortName: 'status.name' },
    { name: 'assignedUser.fullName', title: 'Assigned To', type: 'string', 
      filterName: 'assignedUser.fullName', sortName: 'assignedUser.fullName' },
    { name: 'location.name', title: 'Location', type: 'string', 
      filterName: 'location.name', sortName: 'location.name' },
    { name: 'lastUpdated', title: 'Last Updated', type: 'date', 
      filterName: 'lastUpdated', sortName: 'lastUpdated' }
  ];
  
  assetDataSource: JsonAPIDataSource;
  assetEditComponent = AssetEditComponent;
  assetLocations$: Observable<any[]>;
  totalAssets: BehaviorSubject<string> = new BehaviorSubject<string>('Loading assets...');
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private datastore: JsonApiDatastore,
    private assetService: AssetService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }
  
  ngOnInit(): void {
    // Initialize data source
    this.assetDataSource = new JsonAPIDataSource(
      this.datastore,
      Asset,
      {
        include: 'assetType,status,assignedUser,location',
        sort: '-lastUpdated'
      }
    );
    
    // Load data
    this.assetDataSource.loadData();
    
    // Create observable of asset locations for map
    this.assetLocations$ = this.assetDataSource.connect().pipe(
      map(assets => assets.map(asset => ({
        id: asset.id,
        ticketId: asset.id, // Used by map component for selection
        lat: asset.location?.latitude,
        lon: asset.location?.longitude,
        assetTag: asset.assetTag,
        serialNumber: asset.serialNumber,
        assetType: asset.assetType?.name,
        status: asset.status?.name
      }))),
      shareReplay(1)
    );
    
    // Subscribe to total count
    this.assetDataSource.resultCount
      .pipe(
        takeUntil(this.destroy$),
        map(count => `${count} total assets`)
      )
      .subscribe(this.totalAssets);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  refreshAssets(): void {
    this.assetDataSource.loadData();
  }
  
  importAssets(): void {
    const dialogRef = this.dialog.open(AssetImportComponent, {
      width: '600px',
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.imported) {
        this.snackBar.open(`Successfully imported ${result.count} assets`, 'OK', {
          duration: 3000
        });
        this.refreshAssets();
      }
    });
  }
  
  addNewAsset(): void {
    const dialogRef = this.dialog.open(AssetEditComponent, {
      width: '800px',
      data: {
        model: new Asset(),
        dialogComponent: AssetEditComponent.name,
        savedStatus: false
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (dialogRef.componentInstance.data.savedStatus) {
        this.refreshAssets();
      }
    });
  }
  
  onAssetCellClick(event: any): void {
    console.log('Asset cell clicked:', event);
  }
  
  onAssetColumnsChange(event: any): void {
    console.log('Asset columns changed:', event);
  }
}
```

## Customer Portal Application

### Locate Request Management

This example shows the implementation of a locate request management interface with integrated mapping and filtering.

#### Component Template

```html
<div class="locate-requests-container">
  <app-page-header title="Locate Requests" [subtitle]="ticketCount | async"></app-page-header>
  
  <div class="filter-strip" fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="16px">
    <mat-button-toggle-group [(ngModel)]="activeFilter" (change)="applyStatusFilter()">
      <mat-button-toggle value="all">All Requests</mat-button-toggle>
      <mat-button-toggle value="open">Open</mat-button-toggle>
      <mat-button-toggle value="completed">Completed</mat-button-toggle>
      <mat-button-toggle value="expired">Expired</mat-button-toggle>
    </mat-button-toggle-group>
    
    <mat-form-field appearance="outline">
      <mat-label>Date Range</mat-label>
      <mat-date-range-input [formGroup]="dateFilterForm" [rangePicker]="picker">
        <input matStartDate formControlName="start" placeholder="Start date">
        <input matEndDate formControlName="end" placeholder="End date">
      </mat-date-range-input>
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-date-range-picker #picker></mat-date-range-picker>
    </mat-form-field>
    
    <button mat-flat-button color="primary" (click)="applyDateFilter()">
      Apply Filters
    </button>
    
    <button mat-button (click)="clearFilters()">
      Clear Filters
    </button>
  </div>
  
  <lib-usic-map-table
    [displayedColumns]="ticketColumns"
    [jsonApiDataSource]="ticketDataSource"
    [displayedTickets]="ticketLocations$ | async"
    [filterType]="'column'"
    [expandFilters]="true"
    [provideExcelExport]="true"
    [editComponent]="ticketDetailsComponent"
    [selectByKey]="'ticketId'"
    (clickRow)="onTicketRowClick($event)"
    (changeColumns)="onTicketColumnsChange($event)">
    
    <div class="toolbar-actions">
      <button mat-flat-button color="accent" (click)="createNewRequest()">
        <mat-icon>add</mat-icon> New Request
      </button>
    </div>
  </lib-usic-map-table>
</div>
```

#### Component Class

```typescript
@Component({
  selector: 'app-locate-requests',
  templateUrl: './locate-requests.component.html',
  styleUrls: ['./locate-requests.component.scss']
})
export class LocateRequestsComponent implements OnInit, OnDestroy {
  ticketColumns: UsicTableColumn[] = [
    { name: 'select', type: 'boolean' },
    { name: 'ticketNumber', title: 'Ticket #', type: 'string', 
      filterName: 'ticketNumber', sortName: 'ticketNumber' },
    { name: 'ticketType.name', title: 'Request Type', type: 'string', 
      filterName: 'ticketType.name', sortName: 'ticketType.name' },
    { name: 'address', title: 'Address', type: 'string', 
      filterName: 'address', sortName: 'address' },
    { name: 'createdAt', title: 'Date Created', type: 'date', 
      filterName: 'createdAt', sortName: 'createdAt' },
    { name: 'dueDate', title: 'Due Date', type: 'date', 
      filterName: 'dueDate', sortName: 'dueDate' },
    { name: 'status.name', title: 'Status', type: 'string', 
      filterName: 'status.name', sortName: 'status.name' }
  ];
  
  ticketDataSource: JsonAPIDataSource;
  ticketDetailsComponent = TicketDetailsComponent;
  ticketLocations$: Observable<any[]>;
  ticketCount: BehaviorSubject<string> = new BehaviorSubject<string>('Loading requests...');
  activeFilter: string = 'all';
  
  dateFilterForm = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private datastore: JsonApiDatastore,
    private ticketService: TicketService,
    private authService: AuthenticationService,
    private router: Router,
    private dialog: MatDialog
  ) { }
  
  ngOnInit(): void {
    // Initialize data source with current user filter
    this.ticketDataSource = new JsonAPIDataSource(
      this.datastore,
      Ticket,
      {
        include: 'ticketType,status,excavator',
        sort: '-createdAt',
        filter: {
          customerId: this.authService.currentUser.companyId
        }
      }
    );
    
    // Load data
    this.ticketDataSource.loadData();
    
    // Create observable of ticket locations for map
    this.ticketLocations$ = this.ticketDataSource.connect().pipe(
      map(tickets => tickets.map(ticket => ({
        id: ticket.id,
        ticketId: ticket.id,
        lat: ticket.latitude,
        lon: ticket.longitude,
        address: ticket.address,
        ticketNumber: ticket.ticketNumber,
        createdAt: ticket.createdAt,
        dueDate: ticket.dueDate,
        status: ticket.status?.name,
        photos: ticket.photos || []
      }))),
      shareReplay(1)
    );
    
    // Subscribe to total count
    this.ticketDataSource.resultCount
      .pipe(
        takeUntil(this.destroy$),
        map(count => `${count} total requests`)
      )
      .subscribe(this.ticketCount);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  applyStatusFilter(): void {
    let statusFilter = {};
    
    switch (this.activeFilter) {
      case 'open':
        statusFilter = { 'status.code': 'OPEN,INPROGRESS' };
        break;
      case 'completed':
        statusFilter = { 'status.code': 'COMPLETED' };
        break;
      case 'expired':
        statusFilter = { 'status.code': 'EXPIRED' };
        break;
      default:
        // No filter for 'all'
        break;
    }
    
    // Apply new filter while preserving customer filter
    const baseFilter = { customerId: this.authService.currentUser.companyId };
    this.ticketDataSource.filter = { ...baseFilter, ...statusFilter };
    this.ticketDataSource.loadData();
  }
  
  applyDateFilter(): void {
    const { start, end } = this.dateFilterForm.value;
    
    if (start && end) {
      // Convert to ISO strings for API filtering
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      
      // Apply date filter
      const baseFilter = { 
        customerId: this.authService.currentUser.companyId,
        createdAt: { 
          ge: startDate.toISOString(),
          le: endDate.toISOString()
        }
      };
      
      this.ticketDataSource.filter = baseFilter;
      this.ticketDataSource.loadData();
    }
  }
  
  clearFilters(): void {
    this.activeFilter = 'all';
    this.dateFilterForm.reset();
    
    // Reset to base filter
    this.ticketDataSource.filter = { 
      customerId: this.authService.currentUser.companyId 
    };
    this.ticketDataSource.loadData();
  }
  
  createNewRequest(): void {
    this.router.navigate(['/tickets/new']);
  }
  
  onTicketRowClick(event: any): void {
    const ticketId = event.row.id;
    this.router.navigate(['/tickets', ticketId]);
  }
  
  onTicketColumnsChange(event: any): void {
    console.log('Ticket columns changed:', event);
  }
}
```

## Field Tracking Application

### GPS Fleet Tracking Interface

This example demonstrates the implementation of a real-time GPS tracking interface for fleet management.

#### Component Template

```html
<div class="fleet-tracking-container">
  <app-page-header title="Fleet Tracking" [subtitle]="activeVehicles$ | async"></app-page-header>
  
  <div class="tracking-controls" fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="16px">
    <mat-form-field appearance="outline">
      <mat-label>Filter Vehicles</mat-label>
      <input matInput [formControl]="vehicleFilterControl" placeholder="Enter vehicle ID, type, or driver">
    </mat-form-field>
    
    <mat-checkbox [formControl]="showHistoryControl">
      Show Route History
    </mat-checkbox>
    
    <mat-form-field appearance="outline" *ngIf="showHistoryControl.value">
      <mat-label>History Period</mat-label>
      <mat-select [formControl]="historyPeriodControl">
        <mat-option value="1">Last Hour</mat-option>
        <mat-option value="8">Last 8 Hours</mat-option>
        <mat-option value="24">Last 24 Hours</mat-option>
        <mat-option value="168">Last Week</mat-option>
      </mat-select>
    </mat-form-field>
  </div>
  
  <div class="tracking-container" fxLayout="row" fxLayoutGap="16px">
    <div class="vehicle-list" fxFlex="30">
      <lib-usic-table
        [displayedColumns]="vehicleColumns"
        [jsonApiDataSource]="vehicleDataSource"
        [filtering]="'column'"
        [expandFilters]="true"
        [selectByKey]="'vehicleId'"
        [selectByValue]="selectedVehicleId$ | async"
        (clickRow)="onVehicleRowClick($event)">
      </lib-usic-table>
    </div>
    
    <div class="map-container" fxFlex="70">
      <lib-here-map
        [drivers]="vehicleLocations$ | async"
        [trip]="selectedVehicleRoute$ | async"
        [selectByKey]="'vehicleId'"
        [selectByValue]="selectedVehicleId$ | async"
        (clickMarker)="onVehicleMarkerClick($event)">
        
        <button mat-flat-button color="primary" (click)="centerAllVehicles()">
          <mat-icon>gps_fixed</mat-icon> Show All
        </button>
        
        <button mat-flat-button color="accent" *ngIf="selectedVehicleId$ | async" 
                (click)="trackSelectedVehicle()">
          <mat-icon>follow_the_signs</mat-icon> Track Selected
        </button>
      </lib-here-map>
    </div>
  </div>
  
  <div class="vehicle-details" *ngIf="selectedVehicle$ | async as vehicle">
    <h3>Vehicle Details: {{vehicle.vehicleId}}</h3>
    
    <div fxLayout="row" fxLayoutGap="16px">
      <div fxFlex="33">
        <strong>Driver:</strong> {{vehicle.driver?.name || 'Unassigned'}}
      </div>
      <div fxFlex="33">
        <strong>Status:</strong> {{vehicle.status}}
      </div>
      <div fxFlex="33">
        <strong>Speed:</strong> {{vehicle.currentSpeed}} mph
      </div>
    </div>
    
    <div fxLayout="row" fxLayoutGap="16px">
      <div fxFlex="33">
        <strong>Last Update:</strong> {{vehicle.lastUpdate | date:'medium'}}
      </div>
      <div fxFlex="33">
        <strong>Fuel Level:</strong> {{vehicle.fuelLevel}}%
      </div>
      <div fxFlex="33">
        <strong>Engine Hours:</strong> {{vehicle.engineHours}}
      </div>
    </div>
  </div>
</div>
```

#### Component Class

```typescript
@Component({
  selector: 'app-fleet-tracking',
  templateUrl: './fleet-tracking.component.html',
  styleUrls: ['./fleet-tracking.component.scss']
})
export class FleetTrackingComponent implements OnInit, OnDestroy {
  vehicleColumns: UsicTableColumn[] = [
    { name: 'vehicleId', title: 'Vehicle ID', type: 'string' },
    { name: 'vehicleType', title: 'Type', type: 'string' },
    { name: 'driver.name', title: 'Driver', type: 'string' },
    { name: 'status', title: 'Status', type: 'string' },
    { name: 'currentSpeed', title: 'Speed (mph)', type: 'number' },
    { name: 'lastUpdate', title: 'Last Update', type: 'datetime' }
  ];
  
  vehicleDataSource: JsonAPIDataSource;
  vehicleFilterControl = new FormControl('');
  showHistoryControl = new FormControl(false);
  historyPeriodControl = new FormControl('1');
  
  vehicleLocations$: Observable<any[]>;
  selectedVehicleId$ = new BehaviorSubject<string>(null);
  selectedVehicle$: Observable<any>;
  selectedVehicleRoute$: Observable<any[]>;
  activeVehicles$: Observable<string>;
  
  private refreshInterval: any;
  private destroy$ = new Subject<void>();
  
  constructor(
    private datastore: JsonApiDatastore,
    private fleetService: FleetService,
    private snackBar: MatSnackBar
  ) { }
  
  ngOnInit(): void {
    // Initialize data source
    this.vehicleDataSource = new JsonAPIDataSource(
      this.datastore,
      Vehicle,
      {
        include: 'driver',
        sort: 'vehicleId'
      }
    );
    
    // Apply text filter
    this.vehicleFilterControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filterText => {
      if (filterText) {
        this.vehicleDataSource.filter = {
          $or: [
            { vehicleId: { LIKE: `%${filterText}%` } },
            { vehicleType: { LIKE: `%${filterText}%` } },
            { 'driver.name': { LIKE: `%${filterText}%` } }
          ]
        };
      } else {
        this.vehicleDataSource.filter = {};
      }
      
      this.vehicleDataSource.loadData();
    });
    
    // Create observable of vehicle locations for map
    this.vehicleLocations$ = this.vehicleDataSource.connect().pipe(
      map(vehicles => vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.vehicleId,
        current_lat: vehicle.latitude,
        current_lon: vehicle.longitude,
        color: this.getStatusColor(vehicle.status),
        labelColor: 'white'
      }))),
      shareReplay(1)
    );
    
    // Create observable for active vehicles count
    this.activeVehicles$ = this.vehicleDataSource.resultCount.pipe(
      map(count => `${count} active vehicles`)
    );
    
    // Create observable for selected vehicle
    this.selectedVehicle$ = combineLatest([
      this.vehicleDataSource.connect(),
      this.selectedVehicleId$
    ]).pipe(
      map(([vehicles, selectedId]) => 
        vehicles.find(vehicle => vehicle.id === selectedId)
      ),
      filter(vehicle => !!vehicle)
    );
    
    // Setup route history tracking
    this.selectedVehicleRoute$ = combineLatest([
      this.selectedVehicleId$,
      this.showHistoryControl.valueChanges.pipe(startWith(false)),
      this.historyPeriodControl.valueChanges.pipe(startWith('1'))
    ]).pipe(
      filter(([vehicleId, showHistory]) => !!vehicleId && showHistory),
      switchMap(([vehicleId, _, historyPeriod]) => 
        this.fleetService.getVehicleRouteHistory(vehicleId, Number(historyPeriod))
      )
    );
    
    // Start data refresh interval
    this.startRefreshInterval();
    
    // Load initial data
    this.vehicleDataSource.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearRefreshInterval();
  }
  
  startRefreshInterval(): void {
    this.refreshInterval = setInterval(() => {
      this.vehicleDataSource.loadData();
    }, 30000); // Refresh every 30 seconds
  }
  
  clearRefreshInterval(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
  
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#95c93d'; // USIC green
      case 'idle':
        return '#f5a623'; // Orange
      case 'stopped':
        return '#d0021b'; // Red
      case 'offline':
        return '#9b9b9b'; // Gray
      default:
        return '#0078d7'; // Blue
    }
  }
  
  onVehicleRowClick(event: any): void {
    const vehicleId = event.row.id;
    this.selectedVehicleId$.next(vehicleId);
  }
  
  onVehicleMarkerClick(event: any): void {
    if (event.markerId) {
      this.selectedVehicleId$.next(event.markerId);
    } else {
      this.selectedVehicleId$.next(null);
    }
  }
  
  centerAllVehicles(): void {
    // Map component will handle this via its showAll() method
  }
  
  trackSelectedVehicle(): void {
    const vehicleId = this.selectedVehicleId$.value;
    
    if (vehicleId) {
      this.snackBar.open(`Now tracking vehicle ${vehicleId}`, 'OK', {
        duration: 3000
      });
      
      // In a real implementation, this would enable real-time tracking
    }
  }
}
```

## Reporting Application

### Interactive Dashboard with Custom Visualizations

This example demonstrates the implementation of a dashboard with custom data visualizations and interactive filters.

#### Component Template

```html
<div class="dashboard-container">
  <app-page-header title="Operations Dashboard" [subtitle]="reportDate | date:'longDate'"></app-page-header>
  
  <div class="filter-panel" fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="16px">
    <mat-form-field appearance="outline">
      <mat-label>Date Range</mat-label>
      <mat-date-range-input [formGroup]="dateRangeForm" [rangePicker]="picker">
        <input matStartDate formControlName="start" placeholder="Start date">
        <input matEndDate formControlName="end" placeholder="End date">
      </mat-date-range-input>
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-date-range-picker #picker></mat-date-range-picker>
    </mat-form-field>
    
    <mat-form-field appearance="outline">
      <mat-label>Region</mat-label>
      <mat-select [formControl]="regionControl">
        <mat-option value="all">All Regions</mat-option>
        <mat-option *ngFor="let region of regions$ | async" [value]="region.id">
          {{region.name}}
        </mat-option>
      </mat-select>
    </mat-form-field>
    
    <button mat-flat-button color="primary" (click)="updateDashboard()">
      Update Dashboard
    </button>
    
    <button mat-button (click)="exportDashboard()">
      <mat-icon>download</mat-icon> Export
    </button>
  </div>
  
  <div class="dashboard-grid" fxLayout="row wrap" fxLayoutGap="16px grid">
    <!-- KPI Cards -->
    <div fxFlex="25" fxFlex.lt-md="50" fxFlex.lt-sm="100" *ngFor="let kpi of kpiData$ | async">
      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-value">{{kpi.value | number}}</div>
          <div class="kpi-label">{{kpi.label}}</div>
          <div class="kpi-trend" [ngClass]="{'positive': kpi.trend > 0, 'negative': kpi.trend < 0}">
            <mat-icon>{{kpi.trend > 0 ? 'trending_up' : (kpi.trend < 0 ? 'trending_down' : 'trending_flat')}}</mat-icon>
            <span>{{kpi.trend | number:'1.1-1'}}% vs previous</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    
    <!-- Chart Widgets -->
    <div fxFlex="50" fxFlex.lt-md="100">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Tickets by Status</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="chart-container">
            <canvas baseChart
                   [datasets]="ticketStatusData.datasets"
                   [labels]="ticketStatusData.labels"
                   [options]="ticketStatusOptions"
                   [type]="'doughnut'"
                   height="300">
            </canvas>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    
    <div fxFlex="50" fxFlex.lt-md="100">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Daily Completed Tickets</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="chart-container">
            <canvas baseChart
                   [datasets]="dailyTicketData.datasets"
                   [labels]="dailyTicketData.labels"
                   [options]="lineChartOptions"
                   [type]="'line'"
                   height="300">
            </canvas>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    
    <!-- Map Widget -->
    <div fxFlex="100">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Geographic Distribution</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="map-container" style="height: 400px;">
            <lib-here-map
              [locates]="ticketLocations$ | async"
              [disableShowAll]="false"
              [disableZoom]="false">
            </lib-here-map>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    
    <!-- Detailed Data Table -->
    <div fxFlex="100">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Performance by Team</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <lib-usic-table
            [displayedColumns]="teamColumns"
            [data]="teamPerformance$"
            [provideExcelExport]="true"
            [totaledColumns]="[
              { name: 'completedTickets', total: totalCompletedTickets },
              { name: 'averageResponseTime', total: avgResponseTime }
            ]">
          </lib-usic-table>
        </mat-card-content>
      </mat-card>
    </div>
  </div>
</div>
```

#### Component Class

```typescript
@Component({
  selector: 'app-operations-dashboard',
  templateUrl: './operations-dashboard.component.html',
  styleUrls: ['./operations-dashboard.component.scss']
})
export class OperationsDashboardComponent implements OnInit, OnDestroy {
  // Date controls
  reportDate = new Date();
  dateRangeForm = new FormGroup({
    start: new FormControl(new Date(new Date().setDate(new Date().getDate() - 30))),
    end: new FormControl(new Date())
  });
  
  // Region filter
  regionControl = new FormControl('all');
  regions$: Observable<any[]>;
  
  // KPI data
  kpiData$: Observable<any[]>;
  
  // Chart data
  ticketStatusData: any = {
    labels: ['Open', 'In Progress', 'Completed', 'Expired', 'Cancelled'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: ['#42A5F5', '#FFA726', '#66BB6A', '#EF5350', '#9E9E9E']
      }
    ]
  };
  
  ticketStatusOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  
  dailyTicketData: any = {
    labels: [],
    datasets: [
      {
        label: 'Completed Tickets',
        data: [],
        fill: false,
        borderColor: '#95c93d', // USIC green
        tension: 0.1
      }
    ]
  };
  
  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  };
  
  // Map data
  ticketLocations$: Observable<any[]>;
  
  // Team performance table
  teamColumns: UsicTableColumn[] = [
    { name: 'teamName', title: 'Team', type: 'string' },
    { name: 'teamLead', title: 'Team Lead', type: 'string' },
    { name: 'completedTickets', title: 'Completed Tickets', type: 'number' },
    { name: 'onTimePercentage', title: 'On Time %', type: 'percent' },
    { name: 'averageResponseTime', title: 'Avg Response (hrs)', type: 'number' },
    { name: 'qualityScore', title: 'Quality Score', type: 'number' }
  ];
  
  teamPerformance$: Observable<any[]>;
  totalCompletedTickets: number = 0;
  avgResponseTime: number = 0;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private reportingService: ReportingService,
    private regionsService: RegionsService,
    private exportService: ExportService,
    private snackBar: MatSnackBar
  ) { }
  
  ngOnInit(): void {
    // Load regions for filter
    this.regions$ = this.regionsService.getRegions();
    
    // Initialize dashboard with default filters
    this.updateDashboard();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  updateDashboard(): void {
    const filters = {
      startDate: this.dateRangeForm.value.start,
      endDate: this.dateRangeForm.value.end,
      regionId: this.regionControl.value === 'all' ? null : this.regionControl.value
    };
    
    // Update KPI data
    this.kpiData$ = this.reportingService.getKpiData(filters).pipe(
      tap(() => console.log('KPI data loaded')),
      catchError(error => {
        console.error('Error loading KPI data:', error);
        this.snackBar.open('Error loading KPI data', 'OK', { duration: 3000 });
        return of([]);
      })
    );
    
    // Update ticket status chart
    this.reportingService.getTicketsByStatus(filters).pipe(
      takeUntil(this.destroy$),
      tap(data => {
        this.ticketStatusData.datasets[0].data = [
          data.open || 0,
          data.inProgress || 0,
          data.completed || 0,
          data.expired || 0,
          data.cancelled || 0
        ];
      }),
      catchError(error => {
        console.error('Error loading ticket status data:', error);
        return of(null);
      })
    ).subscribe();
    
    // Update daily ticket chart
    this.reportingService.getDailyTickets(filters).pipe(
      takeUntil(this.destroy$),
      tap(data => {
        this.dailyTicketData.labels = data.map(d => d.date);
        this.dailyTicketData.datasets[0].data = data.map(d => d.count);
      }),
      catchError(error => {
        console.error('Error loading daily ticket data:', error);
        return of(null);
      })
    ).subscribe();
    
    // Update map data
    this.ticketLocations$ = this.reportingService.getTicketLocations(filters).pipe(
      catchError(error => {
        console.error('Error loading ticket locations:', error);
        return of([]);
      })
    );
    
    // Update team performance table
    this.teamPerformance$ = this.reportingService.getTeamPerformance(filters).pipe(
      tap(teams => {
        // Calculate totals for table footer
        this.totalCompletedTickets = teams.reduce((sum, team) => sum + team.completedTickets, 0);
        
        const totalTime = teams.reduce((sum, team) => sum + (team.averageResponseTime * team.completedTickets), 0);
        this.avgResponseTime = this.totalCompletedTickets ? totalTime / this.totalCompletedTickets : 0;
      }),
      catchError(error => {
        console.error('Error loading team performance:', error);
        return of([]);
      })
    );
  }
  
  exportDashboard(): void {
    const filters = {
      startDate: this.dateRangeForm.value.start,
      endDate: this.dateRangeForm.value.end,
      regionId: this.regionControl.value === 'all' ? null : this.regionControl.value
    };
    
    this.exportService.exportDashboard(filters).subscribe(
      blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `operations-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        this.snackBar.open('Dashboard exported successfully', 'OK', { duration: 3000 });
      },
      error => {
        console.error('Error exporting dashboard:', error);
        this.snackBar.open('Error exporting dashboard', 'OK', { duration: 3000 });
      }
    );
  }
}
```

## Common Implementation Patterns

This section highlights recurring implementation patterns across the applications that demonstrate the component library's versatility and cohesion.

### 1. Integrated Map-Table Pattern

A common pattern across multiple applications is the tight integration between tabular data and geospatial visualization. This pattern leverages the `UsicMapTableComponent` to present both a data grid and map view, with synchronized selection and filtering:

```typescript
// Data source initialization
this.dataSource = new JsonAPIDataSource(
  this.datastore,
  SomeModel,
  {
    include: 'relatedEntities',
    sort: 'defaultSortField'
  }
);

// Transform data for map visualization
this.mapLocations$ = this.dataSource.connect().pipe(
  map(items => items.map(item => ({
    id: item.id,          // Unique identifier
    ticketId: item.id,    // Used by map component for selection
    lat: item.latitude,   // Latitude
    lon: item.longitude,  // Longitude
    // Additional properties for information display
    title: item.title,
    status: item.status?.name,
    // etc.
  }))),
  shareReplay(1)  // Cache the result to avoid repeated transformations
);

// Create a subject for tracking selections
this.selectedItemId$ = new BehaviorSubject<number>(null);

// Bind to template
<lib-usic-map-table
  [displayedColumns]="columns"
  [jsonApiDataSource]="dataSource"
  [displayedTickets]="mapLocations$ | async"
  [selectByKey]="'ticketId'"
  [selectByValue]="selectedItemId$ | async"
  (clickRow)="onRowClick($event)">
</lib-usic-map-table>
```

### 2. Reactive Form Integration Pattern

Forms across all applications follow a consistent pattern for integration with the dialog component system:

```typescript
// Form initialization in component
this.itemForm = this.fb.group({
  name: ['', [Validators.required]],
  description: [''],
  category: ['', [Validators.required]],
  status: ['active', [Validators.required]]
});

// Dialog integration in template
<lib-usic-dialog
  title="Edit Item"
  [childForm]="itemForm"
  [canEdit]="hasEditPermission"
  [errors]="validationErrors"
  (submitFunction)="onSubmit($event)"
  (cancelFunction)="onCancel()">
  
  <form [formGroup]="itemForm">
    <!-- Form fields -->
  </form>
  
</lib-usic-dialog>

// Submit handler
onSubmit(form: FormGroup): void {
  if (form.valid) {
    const formData = form.value;
    
    if (this.isEditing) {
      // Update existing
      this.itemService.updateItem(this.itemId, formData)
        .subscribe(
          result => {
            // Handle success
            this.data.savedStatus = true;
          },
          error => {
            // Handle error
            this.validationErrors = this.errorService.getErrorMessages(error);
          }
        );
    } else {
      // Create new
      this.itemService.createItem(formData)
        .subscribe(
          result => {
            // Handle success
            this.data.savedStatus = true;
          },
          error => {
            // Handle error
            this.validationErrors = this.errorService.getErrorMessages(error);
          }
        );
    }
  }
}
```

### 3. Filtered Data Loading Pattern

Applications consistently implement data filtering with debounced updates and loading indicators:

```typescript
// Filter control
this.filterControl = new FormControl('');

// Subscribe to filter changes
this.filterControl.valueChanges.pipe(
  debounceTime(500),
  distinctUntilChanged(),
  takeUntil(this.destroy$)
).subscribe(filterValue => {
  // Apply filter to data source
  if (filterValue) {
    this.dataSource.filter = {
      searchField: { LIKE: `%${filterValue}%` }
    };
  } else {
    this.dataSource.filter = {};
  }
  
  // Reload data with new filter
  this.dataSource.loadData();
});

// Monitor loading state for UI feedback
this.dataSource.loading.pipe(
  takeUntil(this.destroy$)
).subscribe(isLoading => {
  this.isLoading = isLoading;
});

// Template integration
<div class="filter-container">
  <mat-form-field appearance="outline">
    <mat-label>Filter</mat-label>
    <input matInput [formControl]="filterControl">
    <mat-icon matSuffix>search</mat-icon>
  </mat-form-field>
  
  <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>
</div>
```

### 4. Dynamic Column Configuration Pattern

Applications implement dynamic column management with persistent settings:

```typescript
// Define columns with various types and behaviors
const columns: UsicTableColumn[] = [
  { 
    name: 'id', 
    title: 'ID', 
    type: 'string',
    sortName: 'id',
    filterName: 'id'
  },
  { 
    name: 'title', 
    title: 'Title', 
    type: 'string',
    linkRoute: '/items/details',
    linkId: 'id'
  },
  { 
    name: 'category.name',
    title: 'Category', 
    type: 'string',
    filterName: 'category.name'
  },
  { 
    name: 'status', 
    title: 'Status', 
    type: 'component',
    component: StatusIndicatorComponent
  },
  { 
    name: 'actions', 
    title: 'Actions', 
    type: 'icon',
    icon: 'more_vert',
    clickFn: this.showActionsMenu.bind(this)
  }
];

// Column change handler
onColumnsChange(event: any): void {
  // Update local reference if needed
  this.displayedColumns = event.displayedColumns;
  
  // Potentially update other UI elements based on visible columns
  this.updateRelatedComponents();
}
```

These common patterns demonstrate how the component library enables consistent implementation approaches across multiple applications while maintaining flexibility for application-specific requirements.
# Implementation Examples

This document showcases real-world implementation examples of the component library across different applications, demonstrating its flexibility and extensibility.

## Table of Contents

1. [Asset Management Application](#asset-management-application)
2. [Customer Portal Application](#customer-portal-application)
3. [Field Tracking Application](#field-tracking-application)
4. [Reporting Application](#reporting-application)
5. [Common Implementation Patterns](#common-implementation-patterns)

---

## Asset Management Application

### Asset Inventory Table with Map Integration

This example demonstrates the integration of the table component with spatial data visualization for tracking physical assets.

#### Component Template