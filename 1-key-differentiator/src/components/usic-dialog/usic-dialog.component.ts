import { AfterContentInit, Component, ContentChild, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, NgForm } from '@angular/forms';
import { UsicTableComponent } from '../usic-table/usic-table.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { JsonApiModel } from '@michalkotas/angular2-jsonapi';

export type UsicDialogData = {
  model: JsonApiModel;
  dialogComponent?: string;
  savedStatus?: boolean;
  belongsTo?: number;
  filterId?: number;
};

export const DIALOG_CLOSED_NOT_SAVED = ['Canceled.', 'Closed. '];

@Component({
  selector: 'lib-usic-dialog',
  templateUrl: './usic-dialog.component.html',
  styleUrls: ['./usic-dialog.component.scss'],
})

/***
 * Angular component to render a component into mat-dialog.  Note: this component is the boilerplate
 * for the layout, styling and global functionality of the dialogs.  It does not open the dialogs!
 * Opening/closing functionality resides primarily in usic-table.component.ts onRowClick() (preferred)
 * and/or in an individual component's clickRow() or actions events.
 *
 * Author: Pam Tingiris (pamtingiris@usicllc.com)
***/
export class UsicDialogComponent implements OnInit, AfterContentInit {

  /*** STATIC PARAMETERS ***/
  /*
      self                  Returns this component so nested components can access it via 'parent'.
      parentForm            An enclosing FormGroup required for child components that use FormGroups.
      dialogRef             Reference to this component's MatDialog instance (so closing dialogs can be centralized here)
  */
  get self(): UsicDialogComponent { return this; }
  parentForm: UntypedFormGroup;
  dialogRef: MatDialogRef<any>;

  /*** CONTENT CHILDREN ***/
  /*   Enables this component to access the calling component's content (ng-content).   */
  @ContentChild(UsicTableComponent) usicTable: UsicTableComponent;
  @ContentChild(NgForm) dialogForm: NgForm;

  /*** INPUTS ***/
  /*   STRINGS   */
  @Input() title: string;  // page title
  @Input() titleBg: string;  // page title background color
  @Input() readOnlyTooltip: string;  // template sets this as 'READ ONLY' if null (line 19)
  @Input() submitButtonText = 'Save';  // submit button text
  @Input() cancelButtonText = 'Cancel';  // cancel button text

  /*   BOOLEANS   */
  @Input() canEdit: boolean;  // current user's edit capability
  @Input() debug: boolean;  // when true, shows form errors dialog (dialog-buttons.component)
  @Input() submitBtnDisabled: boolean;  // conditional to disable the submit button
  @Input() isSlider: boolean;  // used when there is a nested slider within the dialog
  @Input() showBack: boolean;  // used to show the back arrow in the dialog title bar
  @Input() includeActions = true;  // true to show submit & cancel buttons, false to hide them

  /*   OTHER   */
  // additional dialog action buttons
  @Input() additionalButtons: { buttonName: string; buttonFn: (event: MouseEvent, form: UntypedFormGroup) => any }[];
  @Input() childForm: UntypedFormGroup;  // when using FormGroup, this is the child component's form
  @Input() errors: string[];  // child component's errors get passed as an input (not as data)

  /*** OUTPUTS ***/
  @Output() submitFunction = new EventEmitter<UntypedFormGroup>();  // when the submit button is clicked, the event
  // gets emitted with the child form's values
  @Output() cancelFunction = new EventEmitter<any>();  // when the cancel button is clicked, the event gets emitted

  constructor(
    private fb: UntypedFormBuilder,
    protected dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: UsicDialogData
  ) { }

  ngOnInit(): void {

    // find the open dialog that contains this dialog's editComponent
    if (this.data.dialogComponent) {

      this.dialogRef = this.dialog.openDialogs.find(d => d.componentInstance.constructor.name === this.data.dialogComponent);

      // Ensure the escape key closes the dialog
      this.dialogRef.keydownEvents().subscribe(event => {
        if (event.key === 'Escape') {
          this.onCancel();
          this.data.savedStatus = false;
          this.dialogRef.close('ESC Pressed.');
        }
      });

    }

    // Gives the form in this component access to the calling component's form.
    this.parentForm = this.fb.group({
      childForm: this.childForm
    });

  }

  ngAfterContentInit(): void {

    // Is there an ngForm in the dialog's content?
    // console.log( this.dialogForm || 'No ngForm.' )

    // Is there a table in the dialog's content?
    // console.log( ( this.usicTable?.data || this.usicTable?.jsonApiDataSource ) || 'No table.' )

  }

  /***   TEMPLATE FUNCTIONS   ***/
  /*
      onCancel              Triggers cancel button's event emitter.
      onSubmit              Triggers submit button's event emitter and emits the content component's
                            form value (childForm).
      findInvalidControls   Recursive. Returns an array of invalid control/group names, or a zero-length array if
                            no invalid controls/groups where found. USED TO BUILD THE LIST OF ERRORS
                            THAT IS SHOWN WHEN [debug]=true.
  */
  onCancel() {

    // reset the forms (NOTE: this isn't necessary for FormGroup forms because
    // they are reset by default when canceled.  Leaving it to accommodate occasional ngForms)
    if (this.parentForm) {
      this.parentForm.reset();
    } else {
      this.dialogForm.resetForm();
    }

    this.cancelFunction.emit();

  }

  onSubmit() { // TODO - update function to include globally shared functionality (backlog)

    /*
      NOTE: ultimately this function will handle the lion's share of the functionality required for
      saving dirty forms and/or table data and then updating the underlying model(s).  It does not do that
      yet because each component handles saving slightly differently.  All existing submit functions
      need to be reviewed first.
    */

    // nosemgrep: javascript.lang.security.audit.code-string-concat.code-string-concat
    console.log('***   ' + this.constructor.name + '  ***   onSubmit() -> this.submitFunction.emit');

    // execute local submit function (if it exists)
    this.submitFunction.emit(this.parentForm || this.dialogForm?.form);

    // wait for saving to finish, then close the dialog
    setTimeout(() => {
      // if they all set savedStatus correctly then uncommenting the following if condition
      // will allow dialogs to remain open if there was an error or something that prevented
      // them from saving
      //
      // if (this.dialogRef.componentInstance.data.savedStatus) {
      this.dialogRef?.close('Submitted.');
      // }
    }, 600);

  }

  public findInvalidControls(formToInvestigate: UntypedFormGroup | UntypedFormArray): string[] {
    const invalidControls: string[] = [];
    const recursiveFunc = (form: UntypedFormGroup | UntypedFormArray) => {
      Object.keys(form.controls).forEach(field => {
        const control = form.get(field);
        if (control instanceof UntypedFormGroup) {
          recursiveFunc(control);

          // Also tack on any form level errors
          if (control.errors) {
            Object.keys(control.errors).forEach(formError => {
              invalidControls.push(formError);
            });
          }

        } else if (control instanceof UntypedFormArray) {
          recursiveFunc(control);
        } else if (control.invalid) {
          invalidControls.push(field);
        }
      });
    };

    recursiveFunc(formToInvestigate);
    return invalidControls;
  }
}
