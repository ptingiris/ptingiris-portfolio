/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
import { Component, Injector, Input, OnInit } from '@angular/core';
import { UsicTableColumn } from '../../../models/general';
import { UsicTableComponent } from '../usic-table.component';
import { CellValue } from './cell-value.service';

@Component({
  selector: 'normal-cell',
  templateUrl: './normal-cell.component.html',
  styles: [`
    :host { flex: 1 1 auto }
  `]
})
export class NormalCellComponent implements OnInit {

  @Input() column: UsicTableColumn;
  @Input() element: UsicTableColumn;

  private _parent: UsicTableComponent;
  @Input() set parent(value: UsicTableComponent) {
    this._parent = value;
  }
  get parent(): UsicTableComponent {
    return this._parent;
  }

  myInjector: Injector;

  constructor(private injector: Injector) {

  }

  ngOnInit(): void {

    // enable other components to inject the cell's value
    this.myInjector =
      Injector.create(
        {
          providers: [{
            provide: CellValue,
            useValue: { element: this.element, colName: this.column.name, type: this.column.type, linkUrl: this.column.linkUrl },
            deps: []
          }],
          parent: this.injector
        }
      );

  }

}
