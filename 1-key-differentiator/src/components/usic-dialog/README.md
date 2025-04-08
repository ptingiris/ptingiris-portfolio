# Usic Dialog Component
  
## SUMMARY
This component is the boilerplate for the layout, styling and global functionality for content that is displayed within USIC dialogs.

### Notes
1. This component does not open dialogs!  It only displays content within dialogs and sends event emitters to the calling functions via the SUBMIT and CANCEL buttons.
   
2. Opening/closing functionality resides primarily in the onRowClick() function in usic-table.component.ts (preferred) and/or in an individual component's clickRow() or actions events.

### Discussion

  #### EVENT EMITTERS + onRowClick()
  The event emitters in the dialog form work in conjunction with the calling
  function's dialog.open and afterClosed() methods that are either in usic-table.component.ts onRowClick()
  (preferred) and/or in an individual component's clickRow() or actions events.  For example, note the
  respective values of mat-dialog-close in usic-dialog.component.html line 25 and line 50 in
  dialog-buttons.component.ts ( "Close Icon (usic-dialog)" and "Cancel Button (usic-dialog)" ). The
  buttons in this dialog send the result that is used in the calling function's dialogRef.afterClosed().
  PLEASE NOTE: if a value is not set in mat-dialog-close, the result returns an empty string -- NOT null.
  As a result, logic within hard-coded dialog.open functions that assumes a false value when clicking the
  cancel button breaks (unless the associated mat-dialog-close is explicitly set to false, ie
  [mat-dialog-close]="false").  Using this component in combination with the onRowClick() in
  usic-table.component.ts circumvents that.

     A key goal of this component is to reduce redundancy.
  As an example, the base-list.component in asset manager has usic-table in its template.  Clicking a row in any layout that extends base-list.component triggered the clickRow function that is in that component, which then triggers the clickRow function that is in base-list.component.ts (via super).  The call to open the dialog is in that function. 
  
  usic-table.component is also used in many other layouts throughout the app, however.  Multiple usages don't extend the base-list.component, so those had to explicitly trigger open/close of dialogs within each component.  There were over 40 instances of almost exactly the same code peppered throughout the app. That made tracing & fixing errors and/or making global code changes quite difficult & cumbersome.

  Since the onRowClick function is common to all tables, and virtually all instances of rowClick open a dialog, the trigger to open the dialog should be centralized in the usic-table.component (this involves moving it out of base-list.component and all the components that extend base-list.component and out of all components that trigger the dialog open explicitly.)
