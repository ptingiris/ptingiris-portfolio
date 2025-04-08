/* eslint-disable no-underscore-dangle */
import { Component, Input } from '@angular/core';
import { UsicDialogComponent } from '../usic-dialog.component';

@Component({
  selector: 'usic-dialog-title',
  templateUrl: './dialog-title.component.html',
})
export class DialogTitleComponent {

  private _parent: UsicDialogComponent;
  @Input() set parent(value: UsicDialogComponent ) {
    this._parent = value;
  }
  get parent(): UsicDialogComponent {
    return this._parent;
  }

  constructor() { }

}
