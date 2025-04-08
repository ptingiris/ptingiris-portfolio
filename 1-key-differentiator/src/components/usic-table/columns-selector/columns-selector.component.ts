import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { UsicTableColumn } from '../../../models/general';
import { PersistentSettingsService } from '../../../services/persistent-settings.service';
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: 'lib-columns-selector',
  templateUrl: './columns-selector.component.html',
  styleUrls: ['./columns-selector.component.scss']
})
export class ColumnsSelectorComponent implements OnInit {

  @Input() displayedColumns;
  @Input() prefix: string;
  @Input() hiddenColumns: number[];
  @Input() persistColumns: boolean;

  @Output() changeColumns = new EventEmitter();

  mobileQuery: MediaQueryList;
  private mobileQueryListener: () => void;
  isMobile = false;

  constructor(
    private persistentSettings: PersistentSettingsService,
    media: MediaMatcher,
    changeDetectorRef: ChangeDetectorRef,
    private router: Router,
  ) {
    // Determine if columns should be hidden due to mobile viewer
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this.isMobile = this.mobileQuery.matches;
    this.mobileQueryListener = () => {
      changeDetectorRef.detectChanges();
      this.isMobile = this.mobileQuery.matches;
    };
    this.mobileQuery.addEventListener('change', this.mobileQueryListener);
  }

  ngOnInit(): void {
  }

  reorderColumn(event: CdkDragDrop<UsicTableColumn[]>) {
    if (this.displayedColumns[0].name === 'select') {
      moveItemInArray(this.displayedColumns, event.previousIndex + 1, event.currentIndex + 1);
    } else {
      moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
    }

    const columnOrder: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [index, aColumn] of this.displayedColumns.entries()) {
      columnOrder.push(aColumn.name);
    }
    if (this.persistColumns === true) {
      this.persistentSettings.setSetting(`${this.prefix}${this.prefix ? '-' : ''}column-order`, columnOrder.join(','));
    }

    this.changeColumns.emit({ displayedColumns: this.displayedColumns });
  }

  toggleColumn(column: UsicTableColumn) {
    column.hidden = !column.hidden;

    if (this.persistColumns === true) {
      this.persistentSettings.setSetting(`${this.prefix}${this.prefix ? '-' : ''}${column.name}-hidden`, String(column.hidden));
    }

    // We don't know this column index, do re-calculate hiddenColumns for the exporter
    this.hiddenColumns = [];
    for (const [index, aColumn] of this.displayedColumns.entries()) {
      if (aColumn.name === 'select' || aColumn.hidden) {
        this.hiddenColumns.push(index);
      }
    }

    this.changeColumns.emit({ displayedColumns: this.displayedColumns });
  }

  hideAllColumns() {
    this.hiddenColumns = [];
    for (const [index, column] of this.displayedColumns.entries()) {
      column.hidden = true;
      if (this.persistColumns === true) {
        this.persistentSettings.setSetting(`${this.prefix}${this.prefix ? '-' : ''}${column.name}-hidden`, String(column.hidden));
      }
      this.hiddenColumns.push(index);
    }

    this.changeColumns.emit({ displayedColumns: this.displayedColumns });
  }

  resetColumns() {
    if (this.persistColumns === true) {
      this.persistentSettings.clearSetting(`${this.prefix}${this.prefix ? '-' : ''}column-order`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [index, column] of this.displayedColumns.entries()) {
        this.persistentSettings.clearSetting(`${this.prefix}${this.prefix ? '-' : ''}${column.name}-hidden`);
        this.persistentSettings.clearSetting(`column${column.title}-width`); /* no longer used. for clean-up only. */
        this.persistentSettings.clearSetting(`col-${column.name}-width`);
      }
    }
    this.changeColumns.emit({ displayedColumns: this.displayedColumns, reset: true });

    // redirect to a dummy route and quickly return to the destination route without the user realizing it.
    // dummy route must be different than the currentUrl (hack)
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/login', { skipLocationChange: true }).then(() =>
      this.router.navigate([currentUrl]));
  }
}
