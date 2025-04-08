/* eslint-disable no-underscore-dangle */
import { Component, Input } from '@angular/core';
import { UsicDialogComponent } from '../usic-dialog.component';

@Component({
  selector: 'usic-dialog-content',
  template: `
    <mat-dialog-content class="scroll">

      <!-- Errors -->
      <lib-usic-error-panel [errors]="parent.errors ">
        <!--** source: dialog-content.component **--> </lib-usic-error-panel>

      <div> <ng-content></ng-content> </div>

    </mat-dialog-content>
  `
})
export class DialogContentComponent {

  private _parent: UsicDialogComponent;
  @Input() set parent(value: UsicDialogComponent ) {
    this._parent = value;
  }
  get parent(): UsicDialogComponent {
    return this._parent;
  }

  constructor() { }

}
