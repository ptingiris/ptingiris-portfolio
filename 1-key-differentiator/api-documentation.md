# Component API Documentation

This document provides detailed API documentation for the core components in the Angular component library that powers multiple enterprise applications.

> **Note**: This is a simplified API documentation focusing on the public API surface. The actual implementation includes additional private methods and properties for internal component functionality.

## Table of Contents

1. [UsicTableComponent](#usictablecomponent)
2. UsicDialogComponent
3. HereMapComponent
4. UsicMapTableComponent
5. UsicSidebarComponent
6. JsonAPIDataSource

---

## UsicTableComponent

The enhanced table component that extends Angular Material's MatTable with enterprise features including filtering, column management, and selection.

### Selector
`lib-usic-table`

### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `displayedColumns` | `UsicTableColumn[]` | `[]` | Array of column definitions that determine what data is displayed and how it's formatted |
| `filtering` | `string` | `undefined` | Type of filtering to enable: 'none', 'global', or 'column' |
| `expandFilters` | `boolean` | `false` | Whether to show the filters section when filtering is enabled |
| `provideExcelExport` | `boolean` | `false` | Whether to provide Excel export functionality |
| `selectByKey` | `string` | `undefined` | Column name to use for row selection notifications |
| `selectByValue` | `Observable<any>` | `undefined` | Observable that emits values to select rows by |
| `prefix` | `string` | `undefined` | Prefix to use for storing column settings |
| `allowNew` | `boolean` | `false` | Whether to show the 'New' button for creating records |
| `createButtonText` | `string` | `'New'` | Text to display on the create button |
| `selectedActions` | `{ name: string; icon: string; action: any; enabled: boolean; class?: string }[]` | `[]` | Actions to display for selected rows |
| `persistColumns` | `boolean` | `true` | Whether to persist column settings between sessions |
| `tableClass` | `string` | `'usic-table'` | CSS class to apply to the table |
| `printPreview` | `boolean` | `undefined` | Whether to show print preview styling |
| `editComponent` | `ComponentType<any>` | `undefined` | Component to use for editing rows |
| `data` | `Observable<any[]>` | `undefined` | Observable that emits data for the table (for static data) |
| `totaledColumns` | `{ name: string; total: number }[]` | `[]` | Columns to display totals for |
| `jsonApiDataSource` | `JsonAPIDataSource` | `undefined` | Data source for JSON API data |
| `dataSourceLoading` | `boolean` | `false` | Whether to show loading indicator |
| `cumulativeSelectionsKeys` | `{ name: string; label: string }[]` | `[]` | Keys to use for displaying selected rows |
| `pageSize` | `number` | `5` | Initial page size |
| `customWidth` | `string` | `undefined` | Custom width for the table |
| `selectedRows` | `any[]` | `[]` | Array of selected rows (two-way binding) |
| `cancelRefresh` | `boolean` | `undefined` | Whether to cancel refreshing on dialog close |

### Outputs

| Name | Type | Description |
|------|------|-------------|
| `changePage` | `EventEmitter<PageEvent>` | Emits when page changes |
| `changeSort` | `EventEmitter<Sort>` | Emits when sort changes |
| `openDialog` | `EventEmitter<MatDialogRef<ComponentType<any>>>` | Emits when a dialog is opened |
| `clickCell` | `EventEmitter<any>` | Emits when a cell is clicked |
| `clickRow` | `EventEmitter<any>` | Emits when a row is clicked |
| `dblClickRow` | `EventEmitter<any>` | Emits when a row is double-clicked |
| `createNew` | `EventEmitter<any>` | Emits when the create new button is clicked |
| `deleteRecord` | `EventEmitter<any>` | Emits when a delete action is triggered |
| `changeColumns` | `EventEmitter<any>` | Emits when columns change (hide/show, reorder) |
| `cancelClicked` | `EventEmitter<any>` | Emits when the cancel button is clicked |
| `selectedRowsChange` | `EventEmitter<any[]>` | Emits when selected rows change |
| `refreshData` | `EventEmitter<any>` | Emits when data needs refreshing |
| `rowClasses` | `EventEmitter<any>` | Emits to allow customization of row classes |

### Methods

| Name | Parameters | Return Type | Description |
|------|------------|-------------|-------------|
| `onRowClick` | `event: any, row: any` | `void` | Handles row click events, triggering dialog open or emitting clickRow |
| `onCellClick` | `event: MouseEvent, column: UsicTableColumn, row: any` | `void` | Handles cell click events, executing column click functions or emitting events |
| `onEdit` | `editComponent: ComponentType<any>, row: any` | `void` | Opens an edit dialog for the specified row |
| `toggleRow` | `row: any` | `void` | Toggles selection state of a row |
| `masterToggle` | `wasChecked: boolean` | `void` | Toggles selection state of all rows |
| `exportToExcel` | none | `boolean` | Initiates Excel export of table data |
| `clearFilters` | `dsFilterValues?: any` | `boolean` | Clears all active column filters |
| `setColumnFilter` | `columnName: string, filterValue: string` | `void` | Sets a specific column filter value |
| `refresh` | none | `void` | Refreshes table data |

### UsicTableColumn Interface

```typescript
interface UsicTableColumn {
  name: string;                   // Unique identifier for the column
  title?: string;                 // Display title (falls back to name if not provided)
  type?: string;                  // Data type (string, number, date, boolean, icon, component, etc.)
  hidden?: boolean;               // Whether the column is hidden
  sticky?: boolean;               // Whether the column should be sticky
  icon?: string;                  // Icon to display (for icon type)
  component?: ComponentType<any>; // Component to render (for component type)
  sortName?: string;              // Property name to sort by (if different from name)
  filterName?: string;            // Property name to filter by (if different from name)
  linkRoute?: string;             // Route to navigate to when clicked
  linkId?: string;                // ID field to use for linkRoute
  linkId2?: string;               // Secondary ID field for linkRoute
  linkId3?: string;               // Tertiary ID field for linkRoute
  linkId4?: string;               // Quaternary ID field for linkRoute
  linkUrl?: string;               // URL to open when clicked
  width?: number;                 // Column width in pixels
  clickFn?: Function;             // Function to call when cell is clicked
  clickName?: string;             // Property name to pass to clickFn
  contextFn?: Function;           // Function to call on right-click
  hideMobile?: boolean;           // Whether to hide on mobile
  editable?: boolean;             // Whether the cell is editable
}
