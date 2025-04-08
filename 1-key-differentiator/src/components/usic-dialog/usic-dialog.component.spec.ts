import { UntypedFormBuilder } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsicDialogComponent } from './usic-dialog.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
//import { provideRoutes } from '@angular/router';


describe('UsicDialogComponent', () => {
  let component: UsicDialogComponent;
  let fixture: ComponentFixture<UsicDialogComponent>;

  let fb: UntypedFormBuilder;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ MAT_DIALOG_DATA ],
      providers: [
        { provide: UntypedFormBuilder, useValue: fb },
        { provide: MatDialog, useValue: dialog },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      declarations: [ UsicDialogComponent ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsicDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
