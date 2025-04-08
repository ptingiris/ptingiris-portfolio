import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { UsicMapTableComponent } from './usic-map-table.component';
import { MoreItemComponent } from './more-item/more-item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { UsicTableModule } from '../usic-table/usic-table.module';
import { HereMapModule } from '../here-map/here-map.module';
import { PipesModule } from '../../pipes/pipes.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsicSidebarModule } from '../usic-sidebar/usic-sidebar.module';

@NgModule({
  declarations: [
    UsicMapTableComponent,
    MoreItemComponent
  ],
  exports: [
    UsicMapTableComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    RouterModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    UsicTableModule,
    HereMapModule,
    MatMenuModule,
    PipesModule,
    FlexLayoutModule,
    MatTooltipModule,
    UsicSidebarModule
  ]
})
export class UsicMapTableModule { }
