import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsicDialogComponent } from './usic-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ExtendedModule, FlexModule } from '@angular/flex-layout';
import { UsicErrorPanelModule } from '../usic-error-panel/usic-error-panel.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PipesModule } from '../../pipes/pipes.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogContentComponent } from './usic-dialog-components/dialog-content.component';
import { DialogButtonsComponent } from './usic-dialog-components/dialog-buttons.component';
import { DialogTitleComponent } from './usic-dialog-components/dialog-title.component';

@NgModule({
  declarations: [
    UsicDialogComponent,
    DialogContentComponent,
    DialogButtonsComponent,
    DialogTitleComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ExtendedModule,
    MatDialogModule,
    FlexModule,
    UsicErrorPanelModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    PipesModule,
    MatTooltipModule,
  ],
  providers: [
    PipesModule
  ],
  exports: [
    UsicDialogComponent
  ]
})
export class UsicDialogModule { }
