/* eslint-disable no-underscore-dangle */
import {Component, Input} from '@angular/core';
import {UsicTableComponent} from '../usic-table.component';

@Component({
  selector: 'checkbox-header',
  template: `

    <mat-checkbox
      (change)="$event ? parent.masterToggle(parent.selectionModel.hasValue()) : null"
      [checked]="parent.selectionModel.hasValue()" [indeterminate]="parent.selectionModel.hasValue()"></mat-checkbox>

  `,
})
export class CheckboxHeaderComponent {

  private _parent: UsicTableComponent;
  @Input() set parent(value: UsicTableComponent ) {
    this._parent = value;
  }
  get parent(): UsicTableComponent {
    return this._parent;
  }

  constructor() { }

}
