/* eslint-disable no-underscore-dangle */
import { Component, Input } from '@angular/core';
import { UsicTableComponent } from '../usic-table.component';

@Component({
  selector: 'global-filter',
  template: `

      <div class="global-filter bg-usic-surface-light border-bottom"
           [ngClass]="{ 'show' : parent.expandFilters }">

        <mat-form-field appearance="outline" fxFlex>

          <mat-label>Search Table</mat-label>
          <input matInput
                 [formControl]="parent.globalFilter"
                 (keydown)="$event.stopPropagation()"
                 placeholder="Type a search expression.">
          <mat-icon matSuffix style="transform: translateY(50%) translateX(-10px)">search</mat-icon>

        </mat-form-field>

      </div>

  `,
  styles: [`
    .global-filter {
      height: 100px;
      box-sizing: border-box;
      padding : 1rem;
      transition: all 0.35s;
    }
    .global-filter:not(.show) { height : 0; overflow : hidden; padding : 0; }
  `]
})
export class GlobalFilterComponent {

  private _parent: UsicTableComponent;
  @Input() set parent(value: UsicTableComponent) {
    this._parent = value;
  }
  get parent(): UsicTableComponent {
    return this._parent;
  }

  constructor() { }

}
