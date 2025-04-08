import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule} from '@angular/router';
import { UsicSidebarComponent } from './usic-sidebar.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ResizableModule } from 'angular-resizable-element';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [ UsicSidebarComponent ],
  imports: [
    CommonModule,
    RouterModule,
    FlexLayoutModule,
    ResizableModule,
    MatIconModule,
    MatTooltipModule,
    MatListModule,
    MatButtonModule
  ],
  exports: [ UsicSidebarComponent ]
})
export class UsicSidebarModule { }
