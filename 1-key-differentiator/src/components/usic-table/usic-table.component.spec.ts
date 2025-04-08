import { ClipboardService } from './../../services/clipboard.service';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { UsicTableComponent } from './usic-table.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { MediaMatcher } from '@angular/cdk/layout';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, RendererFactory2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResolvePipe } from '../../pipes/resolve.pipe';
import { PersistentSettingsService } from '../../services/persistent-settings.service';

describe('UsicTableComponent', () => {
  let component: UsicTableComponent;
  let fixture: ComponentFixture<UsicTableComponent>;

  let snackBar: MatSnackBar;
  let resolve: ResolvePipe;
  let changeDetectorRef: ChangeDetectorRef;
  let media: MediaMatcher;
  let persistentSettings: PersistentSettingsService;
  let clipboard: ClipboardService;
  let dialog: MatDialog;
  let http: HttpClient;
  let rendererFactory: RendererFactory2;


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UsicTableComponent],
      providers: [Overlay,
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ResolvePipe, useValue: resolve },
        { provide: ChangeDetectorRef, useValue: changeDetectorRef },
        { provide: MediaMatcher, useValue: media },
        { provide: PersistentSettingsService, useValue: persistentSettings },
        { provide: ClipboardService, useValue: clipboard },
        { provide: MatDialog, useValue: dialog },
        { provide: HttpClient, useValue: http },
        { provide: RendererFactory2, useValue: rendererFactory },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsicTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
