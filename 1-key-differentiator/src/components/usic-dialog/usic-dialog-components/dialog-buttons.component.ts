/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
import { Component, Input } from '@angular/core';
import { UsicDialogComponent } from '../usic-dialog.component';

@Component({
  selector: 'usic-dialog-buttons',
  templateUrl: './dialog-buttons.component.html',
  styles: [`
    .debug-panel {

      background-color: #fff;
      box-shadow: 1px 1px 10px rgba(0,0,0,.42);
      padding: 0 1rem 0 0;
      position : fixed; bottom : 10%; right : 5%;
      text-align: left;
      z-index : 1000;

    }
    .debug-panel .title { padding: 1rem 0 0 1rem; }
    .debug-panel li { margin-bottom : 1em; }
  `]
})
export class DialogButtonsComponent {

  private _parent: UsicDialogComponent;
  @Input() set parent(value: UsicDialogComponent ) {
    this._parent = value;
  }
  get parent(): UsicDialogComponent {
    return this._parent;
  }

  constructor() { }

}
