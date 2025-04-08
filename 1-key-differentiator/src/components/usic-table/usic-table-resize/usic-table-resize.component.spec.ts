import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsicTableModule } from '..';

import { UsicTableResizeComponent } from './usic-table-resize.component';

describe('UsicTableResizeComponent', () => {
  let component: UsicTableResizeComponent;
  let fixture: ComponentFixture<UsicTableResizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ UsicTableModule ],
      declarations: [ UsicTableResizeComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsicTableResizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
