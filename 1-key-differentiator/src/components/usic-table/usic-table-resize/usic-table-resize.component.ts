/* eslint-disable security/detect-object-injection */
import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ContentChild,
  Input, Output, EventEmitter
} from '@angular/core';
import { MatTable } from '@angular/material/table';
import { UsicTableColumn } from '../../../models/general';
import { PersistentSettingsService } from '../../../services/persistent-settings.service';

@Component({
  selector: 'lib-usic-table-resize',
  template: '<ng-content></ng-content>'
})
export class UsicTableResizeComponent implements AfterViewInit {
  @ContentChild(MatTable, { read: ElementRef }) private matTableRef: ElementRef;

  @Input() columns: UsicTableColumn[];
  @Input() persistColumns: boolean;
  @Output() isResizing = new EventEmitter<boolean>();

  pressed = false;
  currentResizeIndex: number;
  startX: number;
  startWidth: number;
  resizableMousemove: () => void;
  resizableMouseup: () => void;
  defaultColumnWidth = 240;

  constructor(
    private renderer: Renderer2,
    protected persistentSettings: PersistentSettingsService,
  ) { }

  ngAfterViewInit() {
    this.setTableResize();
  }

  setTableResize() {
    this.columns?.forEach((column) => {
      if (column.name !== 'select') {

        if (this.persistColumns && this.persistentSettings.getSetting(`col-${column.name}-width`)) {

          column.width = Number(this.persistentSettings.getSetting(`col-${column.name}-width`));

        } else {

          if (column.type === 'icon') {
            column.width = this.defaultColumnWidth / 2;

          } else {
            column.width ||= this.defaultColumnWidth;
          }

        }
      }
    });
  }

  onResizeColumn(event: any, index: number) {
    this.currentResizeIndex = index;
    this.pressed = true;
    this.startX = event.pageX;
    this.startWidth = event.target.closest('mat-header-cell').clientWidth;
    event.preventDefault();
    this.mouseMove(index);
  }

  mouseMove(index: number) {
    this.resizableMousemove = this.renderer.listen('document', 'mousemove', (event) => {
      if (this.pressed && event.buttons) {
        const dx = event.pageX - this.startX;
        const width = this.startWidth + dx;
        if (this.currentResizeIndex === index && width > 50) {
          this.isResizing.emit(true);
          this.setColumnWidthChanges(index, width);
        }
      }
    });
    this.resizableMouseup = this.renderer.listen('document', 'mouseup', () => {
      if (this.pressed) {
        this.pressed = false;
        this.currentResizeIndex = -1;
        this.resizableMousemove();
        this.resizableMouseup();
        setTimeout(() => {
          this.isResizing.emit(false);
        }, 250);

      }
    });
  }

  setColumnWidthChanges(index: number, width: number) {
    const orgWidth = this.columns[index].width;
    const dx = width - orgWidth;

    if (dx !== 0) {
      const newWidth = this.columns[index].width - dx;
      if (newWidth > 50) {
        this.columns[index].width = width;
      }
      if (this.persistColumns === true) {
        this.persistentSettings.setSetting(`col-${this.columns[index].name}-width`, String(this.columns[index].width));
      }
    }
  }

}
