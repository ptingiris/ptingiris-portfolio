import { MatMenuModule } from '@angular/material/menu';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnsSelectorComponent } from './columns-selector.component';
import { Router } from '@angular/router';
import { TitleizePipe } from '../../../pipes/titleize.pipe';

describe('ColumnsSelectorComponent', () => {
  let component: ColumnsSelectorComponent;
  let fixture: ComponentFixture<ColumnsSelectorComponent>;
  const mockRouter = { navigate: jasmine.createSpy('navigate')};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatMenuModule],
      declarations: [ ColumnsSelectorComponent, TitleizePipe ],
      providers: [
        { provide: Router, useValue: mockRouter }

      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnsSelectorComponent);
    component = fixture.componentInstance;
    fixture.componentInstance.displayedColumns = ['select'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
