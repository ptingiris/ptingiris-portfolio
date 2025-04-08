/* eslint-disable no-underscore-dangle */
import { Component, Input } from '@angular/core';
import { UsicTableColumn } from '../../../models/general';
import { UsicTableComponent } from '../usic-table.component';

@Component({
  selector: 'normal-header',
  templateUrl: './normal-header.component.html',
  styles: [`
    mat-form-field { width: 100% }
  `]
})
export class NormalHeaderComponent {

  @Input() column: UsicTableColumn;

  private _parent: UsicTableComponent;
  @Input() set parent(value: UsicTableComponent) {
    this._parent = value;
  }
  get parent(): UsicTableComponent {
    return this._parent;
  }

  constructor() { }

}
