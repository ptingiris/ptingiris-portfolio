/* eslint-disable no-underscore-dangle */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UsicTableComponent } from '../usic-table.component';

@Component({
  selector: 'table-toolbar',
  templateUrl: './table-toolbar.component.html',
  styles: [`
      .table-toolbar { width: 100% }
      .mat-mdc-progress-spinner { display: inline-flex }
      .selected-actions { z-index: 1;}
      .show-selected { cursor: pointer; }
      .more-icon { margin: 0 .75rem; }
      .failed_icon { display: inline-block; position: relative; }
      .failed_icon span::before,
      .failed_icon span::after {
        display: block;
        content: "";
        position: absolute;
        top: 70%;
        left: 90%;
        width: 50%;
        height: 10%;
        margin: -8% 0 0 -65%;
        background: #f25c0f;
        border-radius: 1px;
      }
      .failed_icon span::before { transform: rotate(-45deg); }
      .failed_icon span::after { transform: rotate(45deg); }
      .right-buttons { padding-right: .5em; }
    `]
})
export class TableToolbarComponent {
  @Output() changeColumns = new EventEmitter();
  @Output() cancelClicked = new EventEmitter();

  private _parent: UsicTableComponent;
  @Input() set parent(value: UsicTableComponent) {
    this._parent = value;
  }
  get parent(): UsicTableComponent {
    return this._parent;
  }

  constructor() { }

  onChangeColumns(displayedColumns) {
    this.changeColumns.emit(displayedColumns);
  }

}
