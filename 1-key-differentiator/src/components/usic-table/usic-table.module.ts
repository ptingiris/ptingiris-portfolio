import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexLayoutModule, FlexModule} from '@angular/flex-layout';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '../../pipes/pipes.module';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableExporterModule } from 'mat-table-exporter';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsicTableComponent } from './usic-table.component';
import { CellEditorComponent } from './usic-table-components/cell-editor/cell-editor.component';
import { CheckboxHeaderComponent } from './usic-table-components/checkbox-header.component';
import { ColumnsSelectorComponent } from './columns-selector/columns-selector.component';
import { GlobalFilterComponent } from './usic-table-components/global-filter.component';
import { NormalCellComponent } from './usic-table-components/normal-cell.component';
import { NormalHeaderComponent } from './usic-table-components/normal-header.component';
import { TableToolbarComponent } from './usic-table-components/table-toolbar.component';
import { UsicTableResizeComponent } from './usic-table-resize/usic-table-resize.component';

import { UsicPageHeaderModule } from '../usic-page-header/usic-page-header.module';


@NgModule({
  declarations: [
    UsicTableComponent,
    CellEditorComponent,
    CheckboxHeaderComponent,
    ColumnsSelectorComponent,
    GlobalFilterComponent,
    NormalCellComponent,
    NormalHeaderComponent,
    TableToolbarComponent,
    UsicTableResizeComponent,
  ],
  imports: [
    // Angular
    CommonModule,
    DragDropModule,
    FlexLayoutModule,
    FlexModule,
    FontAwesomeModule,
    FormsModule,
    PipesModule,
    ReactiveFormsModule,
    RouterModule,

    // Material
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableExporterModule,
    MatTableModule,
    MatTooltipModule,

    // USIC-LIB
    UsicPageHeaderModule,
  ],
  providers: [
    PipesModule
  ],
  exports: [
    UsicTableComponent,
  ],
})
export class UsicTableModule { }
